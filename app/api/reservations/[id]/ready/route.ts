import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Mark reservation as ready to talk
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: reservationId } = await params;

    // Verify reservation belongs to this learner
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    if (reservation.learnerId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Check if 4 study logs are submitted
    const count = await prisma.studyLog.count({
      where: { reservationId },
    });

    if (count < 4) {
      return NextResponse.json(
        { error: "Need 4 study logs to be ready" },
        { status: 400 }
      );
    }

    // Update reservation to ready
    const updatedReservation = await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        readyToTalk: true,
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        learner: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // TODO: Send notification to host (email, push, etc.)

    return NextResponse.json(updatedReservation);
  } catch (error) {
    console.error("Ready update error:", error);
    return NextResponse.json(
      { error: "Update failed" },
      { status: 500 }
    );
  }
}
