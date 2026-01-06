import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      progressSinceLastSession,
      textbook,
      currentLesson,
      grammarToStudy,
      selectedTopic,
      conversationGoal,
      additionalNotes,
    } = body;

    // 予約を更新
    const reservation = await db.reservation.update({
      where: { id: params.id },
      data: {
        progressSinceLastSession,
        selectedTopic,
        grammarToStudy,
        conversationGoal,
        additionalNotes,
      },
    });

    // 学習者の情報も更新
    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (user) {
      await db.user.update({
        where: { id: user.id },
        data: {
          textbook,
          currentLesson,
        },
      });
    }

    return NextResponse.json({ success: true, reservation });
  } catch (error) {
    console.error("Prepare error:", error);
    return NextResponse.json(
      { error: "Failed to save preparation" },
      { status: 500 }
    );
  }
}
