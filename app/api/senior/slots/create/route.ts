// app/api/senior/slots/create/route.ts
// API endpoint for seniors to create their own slots from the app

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/senior/slots/create
 *
 * Authenticated endpoint for seniors to create availability slots
 *
 * Request body:
 * {
 *   "date": "2026-04-06",           // Date in YYYY-MM-DD format
 *   "startTime": "11:00",           // Start time in HH:mm format
 *   "endTime": "16:00"              // End time in HH:mm format
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is senior
    if (session.user.role !== "senior") {
      return NextResponse.json(
        { error: "Only seniors can create slots" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { date, startTime, endTime } = body;

    console.log("[/api/senior/slots/create] Request:", {
      userId: session.user.id,
      date,
      startTime,
      endTime,
    });

    // Validate required fields
    if (!date || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Missing required fields: date, startTime, endTime" },
        { status: 400 }
      );
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD" },
        { status: 400 }
      );
    }

    // Validate time format (HH:mm)
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return NextResponse.json(
        { error: "Invalid time format. Use HH:mm" },
        { status: 400 }
      );
    }

    // Construct ISO datetime strings in JST
    const startDateTime = new Date(`${date}T${startTime}:00+09:00`);
    const endDateTime = new Date(`${date}T${endTime}:00+09:00`);

    // Validate datetime objects
    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      return NextResponse.json(
        { error: "Invalid date or time values" },
        { status: 400 }
      );
    }

    // Validate that end time is after start time
    if (endDateTime <= startDateTime) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }

    // Validate that start time is in the future (using JST)
    const nowJST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
    if (startDateTime <= nowJST) {
      return NextResponse.json(
        { error: "Start time must be in the future" },
        { status: 400 }
      );
    }

    // Check for duplicate: same senior + same start time
    const existingSlot = await prisma.slot.findFirst({
      where: {
        hostId: session.user.id,
        startTime: startDateTime,
      },
    });

    if (existingSlot) {
      console.log("[/api/senior/slots/create] Duplicate slot detected");
      return NextResponse.json(
        { error: "You already have a slot at this time" },
        { status: 409 }
      );
    }

    // Create the slot
    const slot = await prisma.slot.create({
      data: {
        hostId: session.user.id,
        sessionType: "both",
        startTime: startDateTime,
        endTime: endDateTime,
        status: "available",
      },
    });

    console.log("[/api/senior/slots/create] Slot created successfully:", slot.id);

    return NextResponse.json(
      {
        success: true,
        slot: {
          id: slot.id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          status: slot.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[/api/senior/slots/create] Error:", error);

    // Check for Prisma-specific errors
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string; meta?: unknown };
      console.error(
        "[/api/senior/slots/create] Prisma error:",
        prismaError.code,
        prismaError.meta
      );

      if (prismaError.code === "P2002") {
        return NextResponse.json(
          { error: "Duplicate slot entry" },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      {
        error: "Failed to create slot",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
