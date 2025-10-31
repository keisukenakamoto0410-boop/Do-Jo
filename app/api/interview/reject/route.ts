import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // Check if user is an interviewer
    if (session.user.userType !== "INTERVIEWER") {
      return NextResponse.json(
        { error: "面接官のみがアクセスできます" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { interviewId, reason } = body;

    if (!interviewId) {
      return NextResponse.json(
        { error: "面接IDが必要です" },
        { status: 400 }
      );
    }

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: "却下理由が必要です" },
        { status: 400 }
      );
    }

    // Find the interview with all related data
    const interview = await db.interview.findUnique({
      where: { id: interviewId },
      include: {
        candidate: {
          select: {
            id: true,
            name: true,
            email: true,
            japaneseLevel: true,
          },
        },
        interviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        slot: {
          select: {
            id: true,
            jobCategory: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    if (!interview) {
      return NextResponse.json(
        { error: "面接が見つかりません" },
        { status: 404 }
      );
    }

    // Verify this interviewer owns this interview
    if (interview.interviewerId !== session.user.id) {
      return NextResponse.json(
        { error: "この面接にアクセスする権限がありません" },
        { status: 403 }
      );
    }

    // Check if interview is in pending status
    if (interview.status !== "PENDING") {
      return NextResponse.json(
        {
          error: `この面接は既に${
            interview.status === "SCHEDULED"
              ? "承認"
              : interview.status === "REJECTED"
              ? "却下"
              : "処理"
          }されています`,
        },
        { status: 400 }
      );
    }

    // Use transaction to reject interview, free slot, and refund usage
    await db.$transaction(async (tx) => {
      // 1. Update interview status to REJECTED
      await tx.interview.update({
        where: { id: interviewId },
        data: {
          status: "REJECTED",
        },
      });

      // 2. Free up the slot
      await tx.interviewSlot.update({
        where: { id: interview.slot.id },
        data: {
          status: "AVAILABLE",
        },
      });

      // 3. Get current month for usage tracking
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // 4. Decrement usage counter (refund the booking)
      const usageTracking = await tx.usageTracking.findUnique({
        where: {
          candidateId_month: {
            candidateId: interview.candidate.id,
            month: firstDayOfMonth,
          },
        },
      });

      if (usageTracking && usageTracking.usageCount > 0) {
        await tx.usageTracking.update({
          where: {
            candidateId_month: {
              candidateId: interview.candidate.id,
              month: firstDayOfMonth,
            },
          },
          data: {
            usageCount: {
              decrement: 1,
            },
          },
        });
      }
    });

    // Send rejection notification email (mock)
    console.log("📧 [Mock Email] Interview Rejection");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`To: ${interview.candidate.email}`);
    console.log(`Subject: 面接リクエスト却下のお知らせ`);
    console.log("\nBody:");
    console.log(`${interview.candidate.name}様`);
    console.log("\n面接リクエストが却下されました。");
    console.log("\n【却下された面接】");
    console.log(
      `日時: ${new Date(interview.slot.startTime).toLocaleDateString("ja-JP")}`
    );
    console.log(`カテゴリー: ${interview.slot.jobCategory}`);
    console.log(`\n【却下理由】\n${reason}`);
    console.log(
      "\n別の日時での予約をお願いいたします。ご利用回数は返還されました。"
    );
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    return NextResponse.json({
      success: true,
      message: "面接リクエストを却下しました",
      interview: {
        id: interview.id,
        status: "REJECTED",
        candidate: {
          name: interview.candidate.name,
        },
        reason,
      },
    });
  } catch (error) {
    console.error("Interview rejection error:", error);
    return NextResponse.json(
      { error: "面接の却下に失敗しました" },
      { status: 500 }
    );
  }
}
