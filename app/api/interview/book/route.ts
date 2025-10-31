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

    // Check if user is a candidate
    if (session.user.userType !== "CANDIDATE") {
      return NextResponse.json(
        { error: "候補者のみが面接を予約できます" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { slotId } = body;

    if (!slotId) {
      return NextResponse.json(
        { error: "スロットIDが必要です" },
        { status: 400 }
      );
    }

    // Start a transaction to ensure data consistency
    const result = await db.$transaction(async (tx) => {
      // 1. Check if slot exists and is available
      const slot = await tx.interviewSlot.findUnique({
        where: { id: slotId },
        include: {
          interviewer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          interviews: {
            where: {
              status: {
                in: ["PENDING", "SCHEDULED", "COMPLETED"],
              },
            },
          },
        },
      });

      if (!slot) {
        throw new Error("スロットが見つかりません");
      }

      if (slot.status !== "AVAILABLE") {
        throw new Error("このスロットは予約できません");
      }

      // Check if slot is already booked
      if (slot.interviews.length > 0) {
        throw new Error("このスロットは既に予約されています");
      }

      // Check if slot is in the past
      if (new Date(slot.startTime) < new Date()) {
        throw new Error("過去のスロットは予約できません");
      }

      // 2. Check usage limit for current month
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      let usageTracking = await tx.usageTracking.findUnique({
        where: {
          candidateId_month: {
            candidateId: session.user.id,
            month: currentMonth,
          },
        },
      });

      // Create usage tracking if it doesn't exist
      if (!usageTracking) {
        usageTracking = await tx.usageTracking.create({
          data: {
            candidateId: session.user.id,
            month: currentMonth,
            usageCount: 0,
            limit: 2,
          },
        });
      }

      // Check if limit is reached
      if (usageTracking.usageCount >= usageTracking.limit) {
        throw new Error(
          `今月の利用制限に達しています（${usageTracking.limit}回/月）`
        );
      }

      // 3. Create interview record with PENDING status
      const interview = await tx.interview.create({
        data: {
          candidateId: session.user.id,
          interviewerId: slot.interviewerId,
          slotId: slot.id,
          scheduledAt: slot.startTime,
          status: "PENDING",
        },
      });

      // Note: Slot status and usage counter will be updated when interviewer approves
      // This allows interviewer to review the request before confirming

      return {
        interview,
        slot,
        usageTracking: await tx.usageTracking.findUnique({
          where: {
            candidateId_month: {
              candidateId: session.user.id,
              month: currentMonth,
            },
          },
        }),
      };
    });

    // Send request notification to interviewer
    console.log("📧 [Mock Email] Booking request notification");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`To: ${result.slot.interviewer.email}`);
    console.log(`Subject: 新しい面接リクエスト`);
    console.log(`From: ${session.user.email}`);
    console.log(`\n${session.user.name}様から面接リクエストが届きました。`);
    console.log(`日時: ${new Date(result.slot.startTime).toLocaleDateString("ja-JP")}`);
    console.log(`カテゴリー: ${result.slot.jobCategory}`);
    console.log("\nダッシュボードから承認してください。");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    return NextResponse.json({
      success: true,
      message: "面接リクエストを送信しました。面接官の承認をお待ちください。",
      interview: {
        id: result.interview.id,
        scheduledAt: result.interview.scheduledAt,
        interviewer: {
          name: result.slot.interviewer.name,
        },
        jobCategory: result.slot.jobCategory,
      },
      usage: {
        used: result.usageTracking?.usageCount || 0,
        limit: result.usageTracking?.limit || 2,
        remaining:
          (result.usageTracking?.limit || 2) -
          (result.usageTracking?.usageCount || 0),
      },
    });
  } catch (error) {
    console.error("Interview booking error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "予約に失敗しました";

    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
