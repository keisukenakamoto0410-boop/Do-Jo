import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 全シニアのセッション数を取得
    const allHosts = await prisma.user.findMany({
      where: {
        role: "senior",
      },
      select: {
        id: true,
        name: true,
        totalSessions: true,
      },
      orderBy: {
        totalSessions: "desc",
      },
    });

    // 自分の順位を計算
    const myIndex = allHosts.findIndex((host) => host.id === session.user.id);
    const myRank = myIndex !== -1 ? myIndex + 1 : null;
    const totalHosts = allHosts.length;

    // 自分のセッション数
    const myData = allHosts.find((host) => host.id === session.user.id);
    const mySessions = myData?.totalSessions || 0;

    // トップ3を取得
    const top3 = allHosts.slice(0, 3).map((host, index) => ({
      rank: index + 1,
      name: host.name,
      sessions: host.totalSessions,
      isMe: host.id === session.user.id,
    }));

    // 感謝メッセージを生成
    let message = "";
    if (myRank === 1) {
      message = "1位です！素晴らしい貢献をありがとうございます！";
    } else if (myRank && myRank <= 3) {
      message = `${myRank}位です！トップ3入り、おめでとうございます！`;
    } else if (myRank && myRank <= 10) {
      message = `${myRank}位です！いつも会話を楽しんでいただきありがとうございます！`;
    } else if (mySessions > 0) {
      message = `${myRank}位です。引き続きよろしくお願いします！`;
    } else {
      message = "まだセッションがありません。最初の会話を楽しみにしています！";
    }

    return NextResponse.json({
      myRank,
      totalHosts,
      mySessions,
      message,
      top3,
    });
  } catch (error) {
    console.error("Host ranking API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch ranking" },
      { status: 500 }
    );
  }
}
