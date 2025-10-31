import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email/sender";
import { feedbackReady } from "@/lib/email/templates";
import { createNotification } from "@/lib/notifications";

/**
 * POST /api/evaluation/submit
 * Submit interviewer evaluation for an interview
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    if (session.user.userType !== "INTERVIEWER") {
      return NextResponse.json(
        { error: "面接官のみアクセスできます" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      interviewId,
      scores,
      comments,
      advice,
      encouragementMessage,
      improvementPoints,
    } = body;

    // Validation
    if (!interviewId || !scores || !comments || !advice || !encouragementMessage) {
      return NextResponse.json(
        { error: "必須項目が入力されていません" },
        { status: 400 }
      );
    }

    // Validate encouragement message length (minimum 50 characters)
    if (encouragementMessage.length < 50) {
      return NextResponse.json(
        { error: "応援メッセージは最低50文字必要です" },
        { status: 400 }
      );
    }

    // Get interview details
    const interview = await db.interview.findUnique({
      where: { id: interviewId },
      include: {
        candidate: true,
        interviewer: true,
        evaluation: true,
      },
    });

    if (!interview) {
      return NextResponse.json(
        { error: "面接が見つかりません" },
        { status: 404 }
      );
    }

    // Check if interviewer owns this interview
    if (interview.interviewerId !== session.user.id) {
      return NextResponse.json(
        { error: "この面接を評価する権限がありません" },
        { status: 403 }
      );
    }

    // Check if already evaluated
    if (interview.evaluation) {
      return NextResponse.json(
        { error: "この面接は既に評価済みです" },
        { status: 400 }
      );
    }

    // Create evaluation
    const evaluation = await db.evaluation.create({
      data: {
        interviewId,
        interviewerId: session.user.id,
        scores: scores,
        comments: `【良かった点】\n${comments}\n\n【改善すべき点】\n${improvementPoints || "特になし"}`,
        advice,
        encouragementMessage,
      },
    });

    // Update interview status
    await db.interview.update({
      where: { id: interviewId },
      data: { status: "COMPLETED" },
    });

    // Calculate overall score percentage for notification
    const totalScore = Object.values(scores).reduce((sum: number, section: any) => {
      return sum + (section.total || 0);
    }, 0);
    const maxScore = 100; // 5 sections × 20 points
    const overallPercentage = Math.round((totalScore / maxScore) * 100);

    // Send email notification to candidate
    const emailTemplate = feedbackReady(
      interview.candidate.name,
      new Date(interview.scheduledAt).toLocaleDateString("ja-JP"),
      interviewId,
      overallPercentage
    );

    await sendEmail({
      to: interview.candidate.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    // Create in-app notification
    await createNotification({
      userId: interview.candidateId,
      type: "FEEDBACK_READY",
      title: "✨ フィードバックが届きました！",
      message: `${new Date(interview.scheduledAt).toLocaleDateString(
        "ja-JP"
      )}の面接フィードバックが届きました。総合スコア: ${overallPercentage}%`,
      link: `/candidate/interview/${interviewId}/feedback`,
    });

    console.log(`✅ Evaluation submitted for interview ${interviewId}`);
    console.log(`📧 Email sent to ${interview.candidate.email}`);
    console.log(`🔔 Notification created for user ${interview.candidateId}`);

    return NextResponse.json({
      message: "評価を提出しました",
      success: true,
      evaluationId: evaluation.id,
    });
  } catch (error) {
    console.error("Evaluation submission error:", error);
    return NextResponse.json(
      { error: "評価の提出に失敗しました" },
      { status: 500 }
    );
  }
}
