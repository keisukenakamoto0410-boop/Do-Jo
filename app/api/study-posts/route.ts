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

    console.log("📤 Post creation started for user:", session.user.id);

    // Check if user already posted today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingPost = await prisma.studyPost.findFirst({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    if (existingPost) {
      console.log("❌ User already posted today");
      return NextResponse.json(
        { error: "本日はすでに投稿済みです" },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const image = formData.get("image") as File;
    const caption = formData.get("caption") as string;

    if (!image) {
      console.log("❌ No image provided");
      return NextResponse.json(
        { error: "画像が必要です" },
        { status: 400 }
      );
    }

    console.log("📷 Image received:", image.name, image.size);

    // Convert image to Base64
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const imageUrl = `data:${image.type};base64,${base64}`;

    console.log("🔄 Image converted to base64");

    // Create post and update user stats in transaction
    console.log("💾 Creating post in database...");
    const result = await prisma.$transaction(async (tx) => {
      // Create the post
      const post = await tx.studyPost.create({
        data: {
          userId: session.user.id,
          imageUrl: imageUrl,
          caption: caption || null,
        },
      });

      console.log("✅ Post created:", post.id);

      // Get current user
      const user = await tx.user.findUnique({
        where: { id: session.user.id },
        select: { totalPosts: true },
      });

      const newTotalPosts = (user?.totalPosts || 0) + 1;

      // Update user stats
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          totalPosts: newTotalPosts,
        },
      });

      console.log("📊 User stats updated - totalPosts:", newTotalPosts);

      return {
        post,
        totalPosts: newTotalPosts,
      };
    });

    console.log("✅ Post creation completed successfully");

    // AI分析を非同期で実行（バックグラウンド）
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    fetch(`${baseUrl}/api/study-posts/${result.post.id}/analyze`, {
      method: "POST",
      headers: {
        Cookie: request.headers.get("cookie") || "",
      },
    }).catch((err) => {
      console.error("Failed to trigger AI analysis:", err);
    });

    console.log("🤖 AI analysis triggered in background");

    return NextResponse.json(result);
  } catch (error) {
    console.error("❌ Study post creation error:", error);
    console.error("Error details:", error instanceof Error ? error.message : error);
    console.error("Stack:", error instanceof Error ? error.stack : "");
    return NextResponse.json(
      {
        error: "投稿の作成に失敗しました",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = parseInt(searchParams.get("limit") || "20");

    const posts = await prisma.studyPost.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        likes: {
          where: {
            userId: session.user.id,
          },
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit + 1,
      ...(cursor && {
        cursor: {
          id: cursor,
        },
        skip: 1,
      }),
    });

    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, -1) : posts;

    return NextResponse.json({
      posts: items.map((post) => ({
        ...post,
        isLiked: post.likes.length > 0,
        likes: undefined,
      })),
      nextCursor: hasMore ? items[items.length - 1].id : null,
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "投稿の取得に失敗しました" },
      { status: 500 }
    );
  }
}
