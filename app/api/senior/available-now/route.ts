import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST: Create a slot starting 10 minutes from now
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "senior") {
      return NextResponse.json(
        { error: "Only seniors can use this feature" },
        { status: 403 }
      );
    }

    const now = new Date();

    // Round up to next 5-minute mark and add 10 minutes
    const minutes = now.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 5) * 5 + 10;

    const startTime = new Date(now);
    startTime.setMinutes(roundedMinutes);
    startTime.setSeconds(0);
    startTime.setMilliseconds(0);

    // If we've gone to next hour, adjust
    if (startTime.getMinutes() >= 60) {
      startTime.setHours(startTime.getHours() + 1);
      startTime.setMinutes(startTime.getMinutes() - 60);
    }

    const endTime = new Date(startTime.getTime() + 25 * 60 * 1000); // 25 minutes

    // Check for overlapping slots
    const existingSlot = await prisma.slot.findFirst({
      where: {
        hostId: session.user.id,
        OR: [
          {
            startTime: { lte: startTime },
            endTime: { gt: startTime },
          },
          {
            startTime: { lt: endTime },
            endTime: { gte: endTime },
          },
          {
            startTime: { gte: startTime },
            endTime: { lte: endTime },
          },
        ],
      },
    });

    if (existingSlot) {
      return NextResponse.json(
        { error: "この時間はすでに登録されています" },
        { status: 409 }
      );
    }

    const slot = await prisma.slot.create({
      data: {
        hostId: session.user.id,
        sessionType: "casual",
        startTime,
        endTime,
        status: "available",
      },
    });

    // Format time for response
    const hours = startTime.getHours().toString().padStart(2, "0");
    const mins = startTime.getMinutes().toString().padStart(2, "0");

    return NextResponse.json(
      {
        message: `${hours}:${mins}から話せる状態になりました！`,
        slot,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating available-now slot:", error);
    return NextResponse.json(
      { error: "Failed to create slot" },
      { status: 500 }
    );
  }
}
