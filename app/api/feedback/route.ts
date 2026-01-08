import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Calculate level based on total score
function calculateLevel(totalScore: number): string {
  if (totalScore >= 7) return "N"; // Native-level
  if (totalScore >= 5) return "F"; // Fluent
  if (totalScore >= 3) return "B"; // Business
  return "L"; // Learner
}

// POST: Create session feedback (senior only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { reservationId, q1, q2, q3, q4, message } = body;

    // Validate required fields
    if (
      !reservationId ||
      q1 === undefined ||
      q2 === undefined ||
      q3 === undefined ||
      q4 === undefined
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate score ranges (0-2)
    const scores = [q1, q2, q3, q4];
    if (scores.some((s) => s < 0 || s > 2)) {
      return NextResponse.json(
        { error: "Scores must be between 0 and 2" },
        { status: 400 }
      );
    }

    // Get reservation and verify the user is the host
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { slot: true },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    if (reservation.hostId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the host can submit feedback" },
        { status: 403 }
      );
    }

    // Check if feedback already exists
    const existingFeedback = await prisma.sessionFeedback.findUnique({
      where: { reservationId },
    });

    if (existingFeedback) {
      return NextResponse.json(
        { error: "Feedback already submitted" },
        { status: 400 }
      );
    }

    // Calculate total score and level
    const totalScore = q1 + q2 + q3 + q4;
    const level = calculateLevel(totalScore);

    // Create feedback
    const feedback = await prisma.sessionFeedback.create({
      data: {
        reservationId,
        q1Accurate: q1,
        q2Keigo: q2,
        q3Naturalness: q3,
        q4NativeFeel: q4,
        totalScore,
        level,
        message: message || null,
      },
    });

    return NextResponse.json({
      success: true,
      feedback: {
        id: feedback.id,
        totalScore,
        level,
      },
    });
  } catch (error) {
    console.error("Failed to create feedback:", error);
    return NextResponse.json(
      { error: "Failed to create feedback" },
      { status: 500 }
    );
  }
}

// GET: Get feedback for a reservation
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reservationId = searchParams.get("reservationId");

    if (!reservationId) {
      return NextResponse.json(
        { error: "Missing reservationId" },
        { status: 400 }
      );
    }

    // Get reservation to verify access
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        learner: { select: { id: true, name: true } },
        host: { select: { id: true, name: true } },
        slot: true,
        sessionFeedback: true,
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    // Check if user has access (is learner or host)
    const isLearner = reservation.learnerId === session.user.id;
    const isHost = reservation.hostId === session.user.id;

    if (!isLearner && !isHost) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const feedback = reservation.sessionFeedback;

    if (!feedback) {
      return NextResponse.json({ feedback: null });
    }

    // For learners, don't show the score - only show the positive feedback
    if (isLearner) {
      return NextResponse.json({
        feedback: {
          id: feedback.id,
          message: feedback.message,
          hostName: reservation.host.name,
          sessionDate: reservation.slot.startTime,
          // Generate positive feedback based on scores
          strengths: generateStrengths(feedback),
          improvements: generateImprovements(feedback),
        },
      });
    }

    // For hosts, show full feedback
    return NextResponse.json({
      feedback: {
        ...feedback,
        learnerName: reservation.learner.name,
        sessionDate: reservation.slot.startTime,
      },
    });
  } catch (error) {
    console.error("Failed to get feedback:", error);
    return NextResponse.json(
      { error: "Failed to get feedback" },
      { status: 500 }
    );
  }
}

// Generate strength messages for learner
function generateStrengths(feedback: {
  q1Accurate: number;
  q2Keigo: number;
  q3Naturalness: number;
  q4NativeFeel: number;
}): string[] {
  const strengths: string[] = [];

  if (feedback.q1Accurate >= 1) {
    strengths.push("You answered questions clearly");
  }
  if (feedback.q2Keigo >= 1) {
    strengths.push("You used polite language well");
  }
  if (feedback.q3Naturalness >= 1) {
    strengths.push("Your expressions sounded natural");
  }
  if (feedback.q4NativeFeel >= 1) {
    strengths.push("The conversation felt smooth");
  }

  return strengths;
}

// Generate improvement suggestions for learner
function generateImprovements(feedback: {
  q1Accurate: number;
  q2Keigo: number;
  q3Naturalness: number;
  q4NativeFeel: number;
}): string[] {
  const improvements: string[] = [];

  if (feedback.q1Accurate === 0) {
    improvements.push(
      "Try to listen carefully and answer what is being asked"
    );
  }
  if (feedback.q2Keigo === 0) {
    improvements.push("Practice using desu/masu forms more often");
  }
  if (feedback.q3Naturalness === 0) {
    improvements.push("Try speaking in shorter sentences for a natural flow");
  }
  if (feedback.q4NativeFeel === 0) {
    improvements.push("Practice using aizuchi (feedback sounds) during conversation");
  }

  return improvements;
}
