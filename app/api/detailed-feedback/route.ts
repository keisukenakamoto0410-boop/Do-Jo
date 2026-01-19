import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendFeedbackNotificationEmail } from "@/lib/email";

// GET: フィードバック取得
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const reservationId = searchParams.get("reservationId");

    if (!reservationId) {
      return NextResponse.json(
        { error: "reservationId is required" },
        { status: 400 }
      );
    }

    // 予約の確認（アクセス権チェック）
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        learner: { select: { id: true, name: true } },
        host: { select: { id: true, name: true } },
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    // ホストまたは学習者のみアクセス可能
    if (
      reservation.hostId !== session.user.id &&
      reservation.learnerId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const detailedFeedback = await prisma.detailedFeedback.findUnique({
      where: { reservationId },
    });

    return NextResponse.json({ detailedFeedback });
  } catch (error) {
    console.error("Error fetching detailed feedback:", error);
    return NextResponse.json(
      { error: "Failed to fetch feedback" },
      { status: 500 }
    );
  }
}

// POST: フィードバック保存
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ホスト（シニア/学生）のみ作成可能
    if (session.user.role !== "senior" && session.user.role !== "student") {
      return NextResponse.json(
        { error: "Only hosts can submit detailed feedback" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      reservationId,
      topics,
      pronunciationScore,
      grammarScore,
      enthusiasmScore,
      comprehensionScore,
      goodExpression,
      improvementFrom,
      improvementTo,
      encouragementMessage,
    } = body;

    // バリデーション
    if (!reservationId) {
      return NextResponse.json(
        { error: "reservationId is required" },
        { status: 400 }
      );
    }

    if (!topics || topics.length === 0) {
      return NextResponse.json(
        { error: "At least one topic is required" },
        { status: 400 }
      );
    }

    if (
      !pronunciationScore ||
      !grammarScore ||
      !enthusiasmScore ||
      !comprehensionScore
    ) {
      return NextResponse.json(
        { error: "All scores are required" },
        { status: 400 }
      );
    }

    if (!encouragementMessage || encouragementMessage.length < 50) {
      return NextResponse.json(
        { error: "Encouragement message must be at least 50 characters" },
        { status: 400 }
      );
    }

    // 予約の確認
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        slot: true,
        learner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        host: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    // ホストのみ作成可能
    if (reservation.hostId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the host can submit feedback for this session" },
        { status: 403 }
      );
    }

    // 既存のフィードバックチェック
    const existingFeedback = await prisma.detailedFeedback.findUnique({
      where: { reservationId },
    });

    if (existingFeedback) {
      return NextResponse.json(
        { error: "Feedback already submitted for this session" },
        { status: 409 }
      );
    }

    // フィードバック作成
    const detailedFeedback = await prisma.detailedFeedback.create({
      data: {
        reservationId,
        topics,
        pronunciationScore,
        grammarScore,
        enthusiasmScore,
        comprehensionScore,
        goodExpression: goodExpression || null,
        improvementFrom: improvementFrom || null,
        improvementTo: improvementTo || null,
        encouragementMessage,
      },
    });

    // メール通知を送信
    const BASE_URL = process.env.NEXTAUTH_URL || "https://do-jo.vercel.app";
    const summaryUrl = `${BASE_URL}/learner/session/${reservationId}/summary`;

    sendFeedbackNotificationEmail({
      learnerEmail: reservation.learner.email!,
      learnerName: reservation.learner.name,
      hostName: reservation.host.name,
      sessionDate: reservation.slot.startTime,
      summaryUrl,
    }).catch((err) => {
      console.error("Failed to send feedback notification email:", err);
    });

    return NextResponse.json({ detailedFeedback }, { status: 201 });
  } catch (error) {
    console.error("Error creating detailed feedback:", error);
    return NextResponse.json(
      { error: "Failed to create feedback" },
      { status: 500 }
    );
  }
}
