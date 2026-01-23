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

    // ホスト宛のお礼メッセージを取得
    const messages = await prisma.thankYouMessage.findMany({
      where: {
        hostId: session.user.id,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
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
