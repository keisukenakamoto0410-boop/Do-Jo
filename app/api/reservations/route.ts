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

    if (status) {
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
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only learners can make reservations
    if (session.user.role !== "learner") {
      return NextResponse.json(
        { error: "Only learners can make reservations" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { slotId, slideTopic } = body;

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

    if (!slot) {
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });
    }

    if (slot.status !== "available" || slot.reservation) {
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
      return NextResponse.json(
        { error: "You already have a reservation at this time" },
        { status: 409 }
      );
    }

    // Create reservation and update slot status in a transaction
    const reservation = await prisma.$transaction(async (tx) => {
      // Update slot status
      await tx.slot.update({
        where: { id: slotId },
        data: { status: "booked" },
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
    const BASE_URL = process.env.NEXTAUTH_URL || "https://do-jo.vercel.app";

    // Email to host (Japanese)
    sendBookingConfirmationEmail({
      hostEmail: reservation.host.email!,
      hostName: reservation.host.name,
      learnerName: reservation.learner.name,
      sessionDate: reservation.slot.startTime,
      sessionUrl: `${BASE_URL}/senior/session/${reservation.id}`,
    }).catch((err) => {
      console.error("Failed to send booking confirmation email to host:", err);
    });

    // Email to learner (English)
    sendLearnerBookingConfirmationEmail({
      learnerEmail: reservation.learner.email!,
      learnerName: reservation.learner.name,
      hostName: reservation.host.name,
      sessionDate: reservation.slot.startTime,
      sessionUrl: `${BASE_URL}/learner/session/${reservation.id}`,
      prepareUrl: `${BASE_URL}/learner/prepare/${reservation.id}`,
    }).catch((err) => {
      console.error("Failed to send booking confirmation email to learner:", err);
    });

    return NextResponse.json({ reservation }, { status: 201 });
  } catch (error) {
    console.error("Error creating reservation:", error);
    return NextResponse.json(
      { error: "Failed to create reservation" },
      { status: 500 }
    );
  }
}
