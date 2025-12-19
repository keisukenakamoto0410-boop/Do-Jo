import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface HostReactions {
  liked: boolean;
  likeCount: number;
  stamps: string[];
  hostComment?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ logId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { logId } = await params;
    const { action, stamp, comment } = await request.json();
    // action: "like" | "stamp" | "comment"

    // Get the study log with reservation to verify host
    const studyLog = await prisma.studyLog.findUnique({
      where: { id: logId },
      include: {
        reservation: true,
      },
    });

    if (!studyLog) {
      return NextResponse.json({ error: "Study log not found" }, { status: 404 });
    }

    // Verify the user is the host of this reservation
    if (studyLog.reservation.hostId !== session.user.id) {
      return NextResponse.json({ error: "Only the host can add reactions" }, { status: 403 });
    }

    const currentReactions: HostReactions = (studyLog.hostReactions as unknown as HostReactions) || {
      liked: false,
      likeCount: 0,
      stamps: [],
    };

    // Update reactions based on action
    const updatedReactions: HostReactions = { ...currentReactions };

    if (action === "like") {
      updatedReactions.liked = !currentReactions.liked;
      updatedReactions.likeCount = currentReactions.liked
        ? Math.max(0, currentReactions.likeCount - 1)
        : currentReactions.likeCount + 1;
    } else if (action === "stamp" && stamp) {
      // Toggle stamp - remove if exists, add if not
      const stampIndex = updatedReactions.stamps.indexOf(stamp);
      if (stampIndex > -1) {
        updatedReactions.stamps = updatedReactions.stamps.filter((s) => s !== stamp);
      } else {
        updatedReactions.stamps = [...updatedReactions.stamps, stamp];
      }
    } else if (action === "comment" && comment !== undefined) {
      updatedReactions.hostComment = comment || undefined;
    }

    // Update the study log
    const updated = await prisma.studyLog.update({
      where: { id: logId },
      data: {
        hostReactions: JSON.parse(JSON.stringify(updatedReactions)),
        // Also update legacy fields for backwards compatibility
        hostLiked: updatedReactions.liked,
        hostComment: updatedReactions.hostComment,
      },
      include: {
        reservation: {
          include: {
            host: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update reactions:", error);
    return NextResponse.json(
      { error: "Failed to update reactions" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ logId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { logId } = await params;

    const studyLog = await prisma.studyLog.findUnique({
      where: { id: logId },
      select: {
        id: true,
        hostReactions: true,
        hostLiked: true,
        hostComment: true,
      },
    });

    if (!studyLog) {
      return NextResponse.json({ error: "Study log not found" }, { status: 404 });
    }

    return NextResponse.json(studyLog);
  } catch (error) {
    console.error("Failed to get reactions:", error);
    return NextResponse.json(
      { error: "Failed to get reactions" },
      { status: 500 }
    );
  }
}
