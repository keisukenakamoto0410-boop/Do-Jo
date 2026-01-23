import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - お礼メッセージを既読にする
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: messageId } = await params;

    // メッセージを取得
    const message = await prisma.thankYouMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return NextResponse.json(
        { error: "メッセージが見つかりません" },
        { status: 404 }
      );
    }

    // ホスト本人か確認
    if (message.hostId !== session.user.id) {
      return NextResponse.json(
        { error: "このメッセージにアクセスする権限がありません" },
        { status: 403 }
      );
    }

    // 既読に更新
    await prisma.thankYouMessage.update({
      where: { id: messageId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to mark message as read:", error);
    return NextResponse.json(
      { error: "既読の更新に失敗しました" },
      { status: 500 }
    );
  }
}
