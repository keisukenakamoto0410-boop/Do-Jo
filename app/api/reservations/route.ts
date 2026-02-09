import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendBookingConfirmationEmail, sendLearnerBookingConfirmationEmail } from "@/lib/email";

// GET reservations for the current user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const isLearner = session.user.role === "learner";

    const where: Record<string, unknown> = isLearner
      ? { learnerId: session.user.id }
      : { hostId: session.user.id };

    // Filter by status - if "confirmed", also include "completed" sessions
    // This allows rejoining a session if End Session was pressed accidentally
    if (status === "confirmed") {
      where.status = { in: ["confirmed", "completed"] };
    } else if (status) {
      where.status = status;
    }

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
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
            university: true,
            major: true,
          },
        },
        detailedFeedback: true,
      },
      orderBy: {
        slot: {
          startTime: "asc",
        },
      },
    });

    // Add hasAgenda and hasFeedback flags for each reservation
    const reservationsWithFlags = reservations.map((r) => ({
      ...r,
      hasAgenda: !!r.generatedAgenda,
      hasFeedback: !!r.detailedFeedback,
    }));

    return NextResponse.json({ reservations: reservationsWithFlags });
  } catch (error) {
    console.error("Error fetching reservations:", error);
    return NextResponse.json(
      { error: "Failed to fetch reservations" },
      { status: 500 }
    );
  }
}

// POST create a new reservation (for learners)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log("[Reservation] Session:", session?.user ? { id: session.user.id, role: session.user.role, email: session.user.email } : null);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only learners can make reservations
    if (session.user.role !== "learner") {
      console.log("[Reservation] Rejected: Not a learner, role is:", session.user.role);
      return NextResponse.json(
        { error: "Only learners can make reservations" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { slotId, slideTopic } = body;
    console.log("[Reservation] Request body:", { slotId, slideTopic });

    if (!slotId) {
      return NextResponse.json(
        { error: "Slot ID is required" },
        { status: 400 }
      );
    }

    // Find the slot
    const slot = await prisma.slot.findUnique({
      where: { id: slotId },
      include: { reservation: true },
    });
    console.log("[Reservation] Slot found:", slot ? { id: slot.id, status: slot.status, hostId: slot.hostId, hasReservation: !!slot.reservation } : null);

    if (!slot) {
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });
    }

    if (slot.status !== "available" || slot.reservation) {
      console.log("[Reservation] Rejected: Slot not available, status:", slot.status);
      return NextResponse.json(
        { error: "Slot is no longer available" },
        { status: 409 }
      );
    }

    // Check if learner already has a reservation at this time
    const existingReservation = await prisma.reservation.findFirst({
      where: {
        learnerId: session.user.id,
        status: { in: ["pending", "confirmed"] },
        slot: {
          startTime: slot.startTime,
        },
      },
    });

    if (existingReservation) {
      console.log("[Reservation] Rejected: Already has reservation at this time");
      return NextResponse.json(
        { error: "You already have a reservation at this time" },
        { status: 409 }
      );
    }

    console.log("[Reservation] Creating reservation with learnerId:", session.user.id, "hostId:", slot.hostId);

    // Create reservation and update slot status in a transaction
    const reservation = await prisma.$transaction(async (tx) => {
      // Update slot status to "reserved" (matching schema comment)
      await tx.slot.update({
        where: { id: slotId },
        data: { status: "reserved" },
      });

      // Create reservation
      return tx.reservation.create({
        data: {
          slotId,
          learnerId: session.user.id,
          hostId: slot.hostId,
          sessionType: slot.sessionType,
          status: "confirmed",
          slideTopic: slideTopic || null,
        },
        include: {
          slot: true,
          host: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              role: true,
            },
          },
          learner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    });

    // Send booking confirmation emails (async, don't block response)
    const rawUrl = process.env.NEXTAUTH_URL;
    const BASE_URL = (rawUrl || "https://do-jo.vercel.app").replace(/\\+$/, "").replace(/\/+$/, "");

    console.log("[Reservation] Sending confirmation emails...");
    console.log("[Reservation] NEXTAUTH_URL raw value:", JSON.stringify(rawUrl));
    console.log("[Reservation] BASE_URL used:", BASE_URL);
    console.log("[Reservation] Host email:", reservation.host.email);
    console.log("[Reservation] Learner email:", reservation.learner.email);
    console.log("[Reservation] GMAIL_USER configured:", !!process.env.GMAIL_USER);
    console.log("[Reservation] GMAIL_APP_PASSWORD configured:", !!process.env.GMAIL_APP_PASSWORD);

    // Email to host (Japanese)
    sendBookingConfirmationEmail({
      hostEmail: reservation.host.email!,
      hostName: reservation.host.name,
      learnerName: reservation.learner.name,
      sessionDate: reservation.slot.startTime,
      sessionUrl: `${BASE_URL}/senior/session/${reservation.id}`,
    }).then((result) => {
      if (result.success) {
        console.log("[Reservation] Host email sent successfully");
      } else {
        console.error("[Reservation] Host email failed:", result.error);
      }
    }).catch((err) => {
      console.error("[Reservation] Failed to send booking confirmation email to host:", err);
    });

    // Email to learner (English)
    sendLearnerBookingConfirmationEmail({
      learnerEmail: reservation.learner.email!,
      learnerName: reservation.learner.name,
      hostName: reservation.host.name,
      sessionDate: reservation.slot.startTime,
      sessionUrl: `${BASE_URL}/learner/session/${reservation.id}`,
      prepareUrl: `${BASE_URL}/learner/prepare/${reservation.id}`,
    }).then((result) => {
      if (result.success) {
        console.log("[Reservation] Learner email sent successfully");
      } else {
        console.error("[Reservation] Learner email failed:", result.error);
      }
    }).catch((err) => {
      console.error("[Reservation] Failed to send booking confirmation email to learner:", err);
    });

    return NextResponse.json({ reservation }, { status: 201 });
  } catch (error) {
    console.error("[Reservation] Error creating reservation:", error);
    // Include more details in the error for debugging
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create reservation", details: errorMessage },
      { status: 500 }
    );
  }
}
