import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "week";

    // 期間の計算
    let startDate: Date;
    const now = new Date();

    if (period === "week") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === "month") {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else {
      startDate = new Date(0); // 全期間
    }

    // StudyPost投稿数でランキング取得
    const rankings = await prisma.user.findMany({
      where: {
        role: "learner",
        studyPosts: {
          some: {
            createdAt: { gte: startDate },
          },
        },
      },
      select: {
        id: true,
        name: true,
        avatar: true,
        country: true,
        _count: {
          select: {
            studyPosts: {
              where: {
                createdAt: { gte: startDate },
              },
            },
          },
        },
      },
      orderBy: {
        studyPosts: {
          _count: "desc",
        },
      },
      take: 10,
    });

    // フォーマット
    const formattedRankings = rankings.map((user) => ({
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      country: user.country,
      postCount: user._count.studyPosts,
    }));

    // 自分の順位を取得
    let myRank = null;
    let myPostCount = 0;

    if (session?.user?.id) {
      const myData = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          _count: {
            select: {
              studyPosts: {
                where: {
                  createdAt: { gte: startDate },
                },
              },
            },
          },
        },
      });

      myPostCount = myData?._count.studyPosts || 0;

      // 自分より投稿数が多い人をカウント
      const higherCount = await prisma.user.count({
        where: {
          role: "learner",
          id: { not: session.user.id },
          studyPosts: {
            some: {
              createdAt: { gte: startDate },
            },
          },
        },
      });

      // 自分の投稿数より多い人の数を正確にカウント
      const usersWithMorePosts = await prisma.user.findMany({
        where: {
          role: "learner",
          id: { not: session.user.id },
          studyPosts: {
            some: {
              createdAt: { gte: startDate },
            },
          },
        },
        select: {
          _count: {
            select: {
              studyPosts: {
                where: {
                  createdAt: { gte: startDate },
                },
              },
            },
          },
        },
      });

      const countHigher = usersWithMorePosts.filter(
        (u) => u._count.studyPosts > myPostCount
      ).length;

      myRank = countHigher + 1;
    }

    return NextResponse.json({
      rankings: formattedRankings,
      myRank,
      myPostCount,
    });
  } catch (error) {
    console.error("Rankings API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch rankings" },
      { status: 500 }
    );
  }
}
