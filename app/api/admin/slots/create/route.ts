// app/api/admin/slots/create/route.ts
// API endpoint for admins to create slots for any senior user

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/admin/slots/create
 *
 * Authenticated endpoint for admins to create availability slots for any senior user
 *
 * Request body:
 * {
 *   "userId": "user-id-here",       // ID of the senior user to create slots for
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

    // Check if user is admin
    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can create slots for other users" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { userId, date, startTime, endTime } = body;

    console.log("[/api/admin/slots/create] Request:", {
      adminId: session.user.id,
      userId,
      date,
      startTime,
      endTime,
    });

    // Validate required fields
    if (!userId || !date || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Missing required fields: userId, date, startTime, endTime" },
        { status: 400 }
      );
    }

    // Verify the target user exists and is a senior
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (targetUser.role !== "senior") {
      return NextResponse.json(
        { error: "Can only create slots for senior users" },
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

    // Generate 30-minute interval slots
    const slots = [];
    const SLOT_DURATION_MS = 30 * 60 * 1000; // 30 minutes in milliseconds

    let currentStart = new Date(startDateTime);

    while (currentStart < endDateTime) {
      const currentEnd = new Date(currentStart.getTime() + SLOT_DURATION_MS);

      // Don't create a slot if it would extend beyond the end time
      if (currentEnd > endDateTime) {
        break;
      }

      // Check for duplicate: same host + same start time
      const existingSlot = await prisma.slot.findFirst({
        where: {
          hostId: userId,
          startTime: currentStart,
        },
      });

      if (existingSlot) {
        console.log("[/api/admin/slots/create] Duplicate slot detected at:", currentStart);
        // Skip this slot but continue with others
        currentStart = currentEnd;
        continue;
      }

      // Create the 30-minute slot for the target user
      const slot = await prisma.slot.create({
        data: {
          hostId: userId,
          sessionType: "both",
          startTime: currentStart,
          endTime: currentEnd,
          status: "available",
        },
      });

      slots.push({
        id: slot.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: slot.status,
      });

      console.log("[/api/admin/slots/create] Created 30-min slot:", slot.id, currentStart.toISOString());

      // Move to next 30-minute interval
      currentStart = currentEnd;
    }

    console.log("[/api/admin/slots/create] Created", slots.length, "slots for user", userId);

    return NextResponse.json(
      {
        success: true,
        message: `${slots.length}個のスロットを作成しました`,
        slots,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[/api/admin/slots/create] Error:", error);

    // Check for Prisma-specific errors
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string; meta?: unknown };
      console.error(
        "[/api/admin/slots/create] Prisma error:",
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
