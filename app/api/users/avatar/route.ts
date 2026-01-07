import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const image = formData.get("image") as File;

    if (!image) {
      return NextResponse.json(
        { error: "画像が必要です" },
        { status: 400 }
      );
    }

    // Validate file size (max 2MB)
    if (image.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: "画像サイズは2MB以下にしてください" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!image.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "画像ファイルのみアップロードできます" },
        { status: 400 }
      );
    }

    // Convert image to Base64
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const avatarUrl = `data:${image.type};base64,${base64}`;

    // Update user avatar
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { avatar: avatarUrl },
      select: {
        id: true,
        name: true,
        avatar: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json(
      { error: "アバターのアップロードに失敗しました" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Remove avatar
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { avatar: null },
      select: {
        id: true,
        name: true,
        avatar: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Avatar delete error:", error);
    return NextResponse.json(
      { error: "アバターの削除に失敗しました" },
      { status: 500 }
    );
  }
}
