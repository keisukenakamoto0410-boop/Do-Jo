import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";

const BUCKET_NAME = "avatars";

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

    // Get file extension
    const ext = image.type.split("/")[1] || "jpg";
    const fileName = `${session.user.id}.${ext}`;

    // Convert File to ArrayBuffer then to Buffer
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Delete existing avatar if exists
    await supabaseAdmin.storage.from(BUCKET_NAME).remove([`${session.user.id}.jpg`, `${session.user.id}.png`, `${session.user.id}.jpeg`, `${session.user.id}.webp`]);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, {
        contentType: image.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json(
        { error: "画像のアップロードに失敗しました" },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    const avatarUrl = urlData.publicUrl;

    // Update user avatar URL in database
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

    // Delete from Supabase Storage
    await supabaseAdmin.storage.from(BUCKET_NAME).remove([
      `${session.user.id}.jpg`,
      `${session.user.id}.png`,
      `${session.user.id}.jpeg`,
      `${session.user.id}.webp`,
    ]);

    // Remove avatar from database
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
