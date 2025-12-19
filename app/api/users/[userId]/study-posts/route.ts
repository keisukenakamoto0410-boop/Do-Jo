import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = parseInt(searchParams.get("limit") || "20");

    const posts = await prisma.studyPost.findMany({
      where: {
        userId,
      },
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

    // Get user stats
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        totalPosts: true,
        canBookSession: true,
        minPostsRequired: true,
      },
    });

    return NextResponse.json({
      posts: items.map((post) => ({
        ...post,
        isLiked: post.likes.length > 0,
        likes: undefined,
      })),
      nextCursor: hasMore ? items[items.length - 1].id : null,
      stats: {
        totalPosts: user?.totalPosts || 0,
        canBookSession: user?.canBookSession || false,
        postsUntilBooking: Math.max(0, (user?.minPostsRequired || 4) - (user?.totalPosts || 0)),
        minPostsRequired: user?.minPostsRequired || 4,
      },
    });
  } catch (error) {
    console.error("Error fetching user posts:", error);
    return NextResponse.json(
      { error: "投稿の取得に失敗しました" },
      { status: 500 }
    );
  }
}
