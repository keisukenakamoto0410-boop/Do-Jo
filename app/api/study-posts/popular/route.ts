import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1週間前の日付を計算
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // いいね数上位5件を取得
    const posts = await prisma.studyPost.findMany({
      where: {
        createdAt: {
          gte: oneWeekAgo,
        },
      },
      orderBy: {
        likeCount: "desc",
      },
      take: 5,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            country: true,
            jlptLevel: true,
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
    });

    // レスポンス用にフォーマット
    const formattedPosts = posts.map((post) => ({
      id: post.id,
      imageUrl: post.imageUrl,
      caption: post.caption,
      likeCount: post.likeCount,
      isLiked: post.likes.length > 0,
      createdAt: post.createdAt.toISOString(),
      user: post.user,
    }));

    return NextResponse.json({ posts: formattedPosts });
  } catch (error) {
    console.error("Failed to fetch popular posts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
