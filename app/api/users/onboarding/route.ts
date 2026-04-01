// app/api/users/onboarding/route.ts
// 初回ログイン時のプロフィール情報更新

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, profileImage } = await req.json();

    if (!name || !profileImage) {
      return NextResponse.json(
        { error: "名前とプロフィール写真は必須です" },
        { status: 400 }
      );
    }

    // Base64画像をデコード
    const base64Data = profileImage.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // ファイル名を生成（ユーザーIDと現在時刻）
    const timestamp = Date.now();
    const filename = `profile-${session.user.id}-${timestamp}.jpg`;

    // 保存先ディレクトリ（public/uploads/profiles）
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "profiles");

    // ディレクトリが存在しない場合は作成
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // ディレクトリが既に存在する場合は無視
    }

    // ファイルを保存
    const filepath = path.join(uploadsDir, filename);
    await writeFile(filepath, buffer);

    // 画像のURLパス
    const imageUrl = `/uploads/profiles/${filename}`;

    // データベースを更新
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name.trim(),
        image: imageUrl,
        onboardingCompleted: true, // オンボーディング完了フラグ
      },
    });

    console.log(`[ONBOARDING] User ${session.user.id} completed onboarding`);

    return NextResponse.json({
      success: true,
      message: "プロフィールを更新しました",
      imageUrl,
    });
  } catch (error) {
    console.error("[ONBOARDING] Error:", error);
    return NextResponse.json(
      { error: "プロフィールの更新に失敗しました" },
      { status: 500 }
    );
  }
}
