import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";

const BUCKET_NAME = "avatars";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        role: true,
        jlptLevel: true,
        nativeLanguage: true,
        learningGoal: true,
        country: true,
        interests: true,
        languages: true,
        totalPosts: true,
        totalSessions: true,
        averageRating: true,
        createdAt: true,
        prefecture: true,
        hobbies: true,
        careerHistory: true,
        expertise: true,
        expertiseTopics: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { userId } = await params;

    if (!session?.user?.id || session.user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const bio = formData.get("bio") as string;
    const avatarFile = formData.get("avatar") as File | null;
    const prefecture = formData.get("prefecture") as string | null;
    const hobbiesJson = formData.get("hobbies") as string | null;
    // Senior fields
    const careerHistory = formData.get("careerHistory") as string | null;
    const expertiseJson = formData.get("expertise") as string | null;
    const expertiseTopicsJson = formData.get("expertiseTopics") as string | null;
    // Learner fields
    const country = formData.get("country") as string | null;
    const jlptLevel = formData.get("jlptLevel") as string | null;
    const learningGoal = formData.get("learningGoal") as string | null;
    const nameKatakana = formData.get("nameKatakana") as string | null;

    let avatarUrl: string | undefined = undefined;

    // アバター画像をSupabase Storageにアップロード
    if (avatarFile && avatarFile.size > 0) {
      // Validate file size (max 2MB)
      if (avatarFile.size > 2 * 1024 * 1024) {
        return NextResponse.json(
          { error: "画像サイズは2MB以下にしてください" },
          { status: 400 }
        );
      }

      const ext = avatarFile.type.split("/")[1] || "jpg";
      const fileName = `${userId}.${ext}`;

      const arrayBuffer = await avatarFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Delete existing avatar if exists
      await supabaseAdmin.storage.from(BUCKET_NAME).remove([
        `${userId}.jpg`, `${userId}.png`, `${userId}.jpeg`, `${userId}.webp`
      ]);

      // Upload to Supabase Storage
      const { error: uploadError } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .upload(fileName, buffer, {
          contentType: avatarFile.type,
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

      avatarUrl = urlData.publicUrl;
    }

    // Parse hobbies from JSON
    let hobbies: string[] | undefined;
    if (hobbiesJson) {
      try {
        hobbies = JSON.parse(hobbiesJson);
      } catch {
        hobbies = undefined;
      }
    }

    // Parse expertise from JSON
    let expertise: string[] | undefined;
    if (expertiseJson) {
      try {
        expertise = JSON.parse(expertiseJson);
      } catch {
        expertise = undefined;
      }
    }

    // Parse expertiseTopics from JSON
    let expertiseTopics: string[] | undefined;
    if (expertiseTopicsJson) {
      try {
        expertiseTopics = JSON.parse(expertiseTopicsJson);
      } catch {
        expertiseTopics = undefined;
      }
    }

    // ユーザー更新
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        bio: bio || null,
        ...(avatarUrl && { avatar: avatarUrl }),
        ...(prefecture !== null && { prefecture: prefecture || null }),
        ...(hobbies !== undefined && { hobbies }),
        // Senior fields
        ...(careerHistory !== null && { careerHistory: careerHistory || null }),
        ...(expertise !== undefined && { expertise }),
        ...(expertiseTopics !== undefined && { expertiseTopics }),
        // Learner fields
        ...(country !== null && { country: country || null }),
        ...(jlptLevel !== null && { jlptLevel: jlptLevel || null }),
        ...(learningGoal !== null && { learningGoal: learningGoal || null }),
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        bio: updatedUser.bio,
        avatar: updatedUser.avatar,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
