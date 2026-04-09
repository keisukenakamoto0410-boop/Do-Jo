import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendCancellationEmail } from "@/lib/email";
import { validateSessionToken, getClientIp } from "@/lib/session-token";

// Admin emails for access control
const ADMIN_EMAILS = ["keisuke.mjugaad91@gmail.com"];

// DELETE cancel a reservation (with optional reason)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get cancellation reason from request body if provided
    let reason = "";
    try {
      const body = await req.json();
      reason = body.reason || "";
    } catch {
      // No body provided, that's okay
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        slot: true,
        learner: {
          select: { id: true, name: true, email: true }
        },
        host: {
          select: { id: true, name: true, email: true }
        }
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    // Check if user owns this reservation
    const isLearner = reservation.learnerId === session.user.id;
    const isHost = reservation.hostId === session.user.id;

    if (!isLearner && !isHost) {
      return NextResponse.json(
        { error: "Not authorized to cancel this reservation" },
        { status: 403 }
      );
    }

    // Check if reservation can be cancelled (not already completed or cancelled)
    if (reservation.status === "completed" || reservation.status === "cancelled") {
      return NextResponse.json(
        { error: "Cannot cancel this reservation" },
        { status: 400 }
      );
    }

    // Cancel reservation and restore slot availability
    await prisma.$transaction(async (tx) => {
      await tx.reservation.update({
        where: { id },
        data: {
          status: "cancelled",
          cancelledAt: new Date(),
        },
      });

      await tx.slot.update({
        where: { id: reservation.slotId },
        data: { status: "available" },
      });
    });

    // Send cancellation notification email to the other party
    const cancelledBy = isLearner ? "learner" : "host";
    const cancellerName = isLearner ? reservation.learner.name : reservation.host.name;
    const recipientEmail = isLearner ? reservation.host.email : reservation.learner.email;
    const recipientName = isLearner ? reservation.host.name : reservation.learner.name;

    try {
      await sendCancellationEmail({
        recipientEmail,
        recipientName,
        cancellerName,
        cancelledBy,
        sessionDate: new Date(reservation.slot.startTime),
        reason,
      });
    } catch (emailError) {
      console.error("Failed to send cancellation email:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error cancelling reservation:", error);
    return NextResponse.json(
      { error: "Failed to cancel reservation" },
      { status: 500 }
    );
  }
}

// GET single reservation
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Try token-based authentication first (for LINE users)
    const authHeader = req.headers.get("Authorization");
    const sessionToken = authHeader?.replace("Bearer ", "") || req.nextUrl.searchParams.get("token");

    let userId: string | null = null;
    let userRole: string | null = null;

    if (sessionToken) {
      // Validate session token with IP address verification
      const clientIp = getClientIp(req);
      const tokenData = await validateSessionToken(sessionToken, clientIp);
      if (tokenData && tokenData.reservationId === id) {
        userId = tokenData.userId;
        userRole = tokenData.userRole;
      }
    }

    // Fall back to NextAuth session if no token
    if (!userId) {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = session.user.id;
      userRole = session.user.role;
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      select: {
        id: true,
        slotId: true,
        learnerId: true,
        hostId: true,
        status: true,
        sessionType: true,
        channelName: true,
        token: true,
        readyToTalk: true,
        studyLogCount: true,
        // 学習者が事前に設定した会話準備情報
        selectedTopic: true,
        slideTopic: true,
        grammarToStudy: true,
        targetWords: true,
        conversationGoal: true,
        additionalNotes: true,
        sharedMaterial: true,
        generatedAgenda: true,
        progressSinceLastSession: true,
        // セッション管理
        learnerJoinedAt: true,
        hostJoinedAt: true,
        sessionStartedAt: true,
        startedAt: true,
        completedAt: true,
        cancelledAt: true,
        createdAt: true,
        reminderSent: true,
        slot: true,
        learner: {
          select: {
            id: true,
            name: true,
            avatar: true,
            bio: true,
            country: true,
            nativeLanguage: true,
            jlptLevel: true,
            learningGoal: true,
            interests: true,
            textbook: true,
            currentLesson: true,
            wantsToWorkInJapan: true,
            hometownFood: true,
            hometownFoodDesc: true,
            hometownPlace: true,
            hometownPlaceDesc: true,
          },
        },
        host: {
          select: {
            id: true,
            name: true,
            avatar: true,
            bio: true,
            role: true,
            languages: true,
            interests: true,
            averageRating: true,
            careerHistory: true,
            expertise: true,
          },
        },
        detailedFeedback: true,
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    // Check if user is part of this reservation or admin
    const isLearner = reservation.learnerId === userId;
    const isHost = reservation.hostId === userId;
    const isAdmin = userRole === "admin";

    if (!isLearner && !isHost && !isAdmin) {
      return NextResponse.json(
        { error: "Not authorized to view this reservation" },
        { status: 403 }
      );
    }

    return NextResponse.json(reservation);
  } catch (error) {
    console.error("Error fetching reservation:", error);
    return NextResponse.json(
      { error: "Failed to fetch reservation" },
      { status: 500 }
    );
  }
}
