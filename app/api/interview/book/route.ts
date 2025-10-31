import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email/sender";
import {
  bookingConfirmation,
  interviewRequestForInterviewer,
} from "@/lib/email/templates";
import { createNotification } from "@/lib/notifications";

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

    // TODO: Get candidate details for emails
    const candidate = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        japaneseLevel: true,
      },
    });

    if (!candidate) {
      throw new Error("候補者情報が見つかりません");
    }

    const interviewDate = new Date(result.slot.startTime).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // 1. Send confirmation email to candidate
    const confirmationEmail = bookingConfirmation(
      candidate.name,
      interviewDate,
      result.slot.interviewer.name,
      result.interview.id
    );

    await sendEmail({
      to: candidate.email,
      subject: confirmationEmail.subject,
      html: confirmationEmail.html,
      text: confirmationEmail.text,
    });

    // 2. Send notification email to interviewer
    const interviewerEmail = interviewRequestForInterviewer(
      result.slot.interviewer.name,
      candidate.name,
      interviewDate,
      candidate.japaneseLevel || "未設定",
      result.interview.id
    );

    await sendEmail({
      to: result.slot.interviewer.email,
      subject: interviewerEmail.subject,
      html: interviewerEmail.html,
      text: interviewerEmail.text,
    });

    // 3. Create in-app notification for candidate
    await createNotification({
      userId: session.user.id,
      type: "BOOKING_CONFIRMED",
      title: "面接予約リクエストを受け付けました",
      message: `${result.slot.interviewer.name}さんとの面接予約リクエストを送信しました。承認をお待ちください。`,
      link: `/candidate/dashboard`,
    });

    // 4. Create in-app notification for interviewer
    await createNotification({
      userId: result.slot.interviewerId,
      type: "INTERVIEW_REQUEST",
      title: "📬 新しい面接予約リクエスト",
      message: `${candidate.name}さんから${interviewDate}の面接予約リクエストが届きました。`,
      link: `/interviewer/requests`,
    });

    console.log(`✅ Interview booking created: ${result.interview.id}`);
    console.log(`📧 Emails sent to candidate and interviewer`);
    console.log(`🔔 Notifications created for both users`);

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
