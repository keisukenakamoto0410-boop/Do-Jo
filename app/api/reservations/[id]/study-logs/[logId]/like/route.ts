import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Host likes a study log
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; logId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: reservationId, logId } = await params;

    // Verify user is the host of this reservation
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    if (reservation.hostId !== session.user.id) {
      return NextResponse.json({ error: "Only host can like" }, { status: 403 });
    }

    // Get optional comment from request body
    let comment: string | undefined;
    try {
      const body = await request.json();
      comment = body.comment;
    } catch {
      // No body or invalid JSON, that's fine
    }

    // Toggle like or add comment
    const studyLog = await prisma.studyLog.findUnique({
      where: { id: logId },
    });

    if (!studyLog) {
      return NextResponse.json({ error: "Study log not found" }, { status: 404 });
    }

    const updatedLog = await prisma.studyLog.update({
      where: { id: logId },
      data: {
        hostLiked: !studyLog.hostLiked,
        hostComment: comment || studyLog.hostComment,
      },
    });

    return NextResponse.json(updatedLog);
  } catch (error) {
    console.error("Like error:", error);
    return NextResponse.json(
      { error: "Like failed" },
      { status: 500 }
    );
  }
}
