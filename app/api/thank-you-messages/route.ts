import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - ホスト宛のお礼メッセージ一覧を取得
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unread") === "true";

    // ホスト宛のお礼メッセージを取得（learnerの地元自慢情報も含む）
    const rawMessages = await prisma.thankYouMessage.findMany({
      where: {
        hostId: session.user.id,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    // 学習者の情報を取得
    const learnerIds = [...new Set(rawMessages.map(m => m.learnerId))];
    const learners = await prisma.user.findMany({
      where: { id: { in: learnerIds } },
      select: {
        id: true,
        name: true,
        avatar: true,
        country: true,
        hometownFood: true,
        hometownFoodDesc: true,
        hometownPlace: true,
        hometownPlaceDesc: true,
      },
    });

    const learnerMap = new Map(learners.map(l => [l.id, l]));

    // 有効な商品マッピングを取得
    const productMappings = await prisma.productMapping.findMany({
      where: { isActive: true },
    });

    // メッセージにlearner情報と商品マッピングを追加
    const messages = rawMessages.map(m => {
      const learner = learnerMap.get(m.learnerId);
      let matchedProduct = null;

      // 学習者のhometownFoodでマッチングを検索
      if (learner?.hometownFood) {
        const foodKeyword = learner.hometownFood.toLowerCase();
        matchedProduct = productMappings.find(p =>
          foodKeyword.includes(p.keyword) || p.keyword.includes(foodKeyword)
        ) || null;
      }

      return {
        ...m,
        learner: learner || null,
        matchedProduct,
      };
    });

    // 未読数を取得
    const unreadCount = await prisma.thankYouMessage.count({
      where: {
        hostId: session.user.id,
        isRead: false,
      },
    });

    return NextResponse.json({
      messages,
      unreadCount,
    });
  } catch (error) {
    console.error("Failed to get thank you messages:", error);
    return NextResponse.json(
      { error: "お礼メッセージの取得に失敗しました" },
      { status: 500 }
    );
  }
}
