import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateAgendaFromTemplate } from "@/lib/agenda-templates";

/**
 * POST /api/reservations/[id]/generate-agenda
 * 完全無料のテンプレートベースアジェンダ生成
 * AI使用なし - コスト$0
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: reservationId } = await params;

    // 予約情報を取得
    const reservation = await db.reservation.findUnique({
      where: { id: reservationId },
      include: {
        learner: {
          select: {
            id: true,
            name: true,
            country: true,
            jlptLevel: true,
            learningGoal: true,
            interests: true,
          },
        },
        host: {
          select: {
            id: true,
            name: true,
          },
        },
        slot: true,
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    // 学習者でない場合はエラー
    if (session.user.id !== reservation.learnerId) {
      return NextResponse.json(
        { error: "Only the learner can generate agenda" },
        { status: 403 }
      );
    }

    // すでにアジェンダが生成されている場合は再生成しない
    if (reservation.generatedAgenda) {
      return NextResponse.json({
        success: true,
        agenda: reservation.generatedAgenda,
        alreadyGenerated: true,
      });
    }

    // トピックを決定（デフォルトは日常会話）
    const topicKey = reservation.selectedTopic || "daily_conversation";

    // テンプレートからアジェンダを生成
    const agenda = generateAgendaFromTemplate(topicKey, {
      name: reservation.learner!.name,
      country: reservation.learner!.country || undefined,
      jlptLevel: reservation.learner!.jlptLevel || undefined,
      targetWords: reservation.targetWords || [],
    });

    // 学習者の目標を追加
    const enhancedAgenda = {
      ...agenda,
      learnerInfo: {
        name: reservation.learner!.name,
        country: reservation.learner!.country,
        jlptLevel: reservation.learner!.jlptLevel,
        learningGoal: reservation.learner!.learningGoal,
        interests: reservation.learner!.interests || [],
      },
      conversationGoal: reservation.conversationGoal || "楽しく日本語を話す",
      sessionDate: reservation.slot.startTime,
      generatedAt: new Date().toISOString(),
    };

    // DBに保存
    await db.reservation.update({
      where: { id: reservationId },
      data: {
        generatedAgenda: enhancedAgenda as any,
      },
    });

    console.log(`[Agenda] Template-based agenda generated for reservation ${reservationId}`);

    return NextResponse.json({
      success: true,
      agenda: enhancedAgenda,
      message: "アジェンダを生成しました！",
    });
  } catch (error) {
    console.error("[Agenda Generation Error]:", error);
    return NextResponse.json(
      {
        error: "Failed to generate agenda",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
