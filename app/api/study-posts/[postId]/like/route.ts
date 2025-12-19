import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await params;

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: session.user.id,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.$transaction([
        prisma.like.delete({
          where: {
            id: existingLike.id,
          },
        }),
        prisma.studyPost.update({
          where: { id: postId },
          data: {
            likeCount: {
              decrement: 1,
            },
          },
        }),
      ]);

      return NextResponse.json({ liked: false });
    } else {
      // Like
      await prisma.$transaction([
        prisma.like.create({
          data: {
            postId,
            userId: session.user.id,
          },
        }),
        prisma.studyPost.update({
          where: { id: postId },
          data: {
            likeCount: {
              increment: 1,
            },
          },
        }),
      ]);

      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error("Like error:", error);
    return NextResponse.json(
      { error: "いいねの処理に失敗しました" },
      { status: 500 }
    );
  }
}
