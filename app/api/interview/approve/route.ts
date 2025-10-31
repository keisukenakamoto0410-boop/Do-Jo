import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email/sender";
import { bookingApproved } from "@/lib/email/templates";
import { createNotification } from "@/lib/notifications";

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
    const { interviewId } = body;

    if (!interviewId) {
      return NextResponse.json(
        { error: "面接IDが必要です" },
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

    // Use transaction to approve interview, update slot, and increment usage
    const updatedInterview = await db.$transaction(async (tx) => {
      // 1. Update interview status to SCHEDULED
      const updated = await tx.interview.update({
        where: { id: interviewId },
        data: {
          status: "SCHEDULED",
        },
        include: {
          candidate: true,
          slot: true,
        },
      });

      // 2. Mark slot as BOOKED
      await tx.interviewSlot.update({
        where: { id: updated.slotId },
        data: {
          status: "BOOKED",
        },
      });

      // 3. Increment usage counter
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      await tx.usageTracking.upsert({
        where: {
          candidateId_month: {
            candidateId: interview.candidate.id,
            month: currentMonth,
          },
        },
        update: {
          usageCount: {
            increment: 1,
          },
        },
        create: {
          candidateId: interview.candidate.id,
          month: currentMonth,
          usageCount: 1,
          limit: 2,
        },
      });

      return updated;
    });

    // Format interview date for display
    const interviewDate = new Date(interview.slot.startTime).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // 1. Send approval email to candidate
    const approvalEmail = bookingApproved(
      interview.candidate.name,
      interviewDate,
      interview.interviewer.name,
      interviewId
    );

    await sendEmail({
      to: interview.candidate.email,
      subject: approvalEmail.subject,
      html: approvalEmail.html,
      text: approvalEmail.text,
    });

    // 2. Create in-app notification for candidate
    await createNotification({
      userId: interview.candidate.id,
      type: "BOOKING_APPROVED",
      title: "🎉 面接予約が承認されました！",
      message: `${interview.interviewer.name}さんとの面接が${interviewDate}に確定しました。`,
      link: `/candidate/interview/${interviewId}`,
    });

    console.log(`✅ Interview approved: ${interviewId}`);
    console.log(`📧 Approval email sent to ${interview.candidate.email}`);
    console.log(`🔔 Notification created for candidate`);

    return NextResponse.json({
      success: true,
      message: "面接リクエストを承認しました",
      interview: {
        id: updatedInterview.id,
        status: updatedInterview.status,
        candidate: {
          name: interview.candidate.name,
        },
        scheduledAt: updatedInterview.scheduledAt,
      },
    });
  } catch (error) {
    console.error("Interview approval error:", error);
    return NextResponse.json(
      { error: "面接の承認に失敗しました" },
      { status: 500 }
    );
  }
}
