// app/api/slots/create/route.ts
// API endpoint for Google Forms integration to create slots

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/slots/create
 *
 * Called by Google Apps Script when a senior submits a Google Form
 * Creates a slot in the Supabase database
 *
 * Request body:
 * {
 *   "teacherName": "山田太郎",  // Teacher's name (required)
 *   "scheduledAt": "2026-04-06T09:00:00+09:00",  // ISO 8601 datetime (required)
 *   "durationMinutes": 60      // Duration in minutes (required)
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { teacherName, scheduledAt, durationMinutes } = body;

    console.log("[/api/slots/create] Request:", { teacherName, scheduledAt, durationMinutes });

    // Validate required fields
    if (!teacherName) {
      return NextResponse.json(
        { error: "Missing required field: teacherName" },
        { status: 400 }
      );
    }

    if (!scheduledAt) {
      return NextResponse.json(
        { error: "Missing required field: scheduledAt" },
        { status: 400 }
      );
    }

    if (!durationMinutes || typeof durationMinutes !== 'number' || durationMinutes <= 0) {
      return NextResponse.json(
        { error: "Invalid durationMinutes. Must be a positive number" },
        { status: 400 }
      );
    }

    // Parse and validate scheduledAt
    const startTime = new Date(scheduledAt);
    if (isNaN(startTime.getTime())) {
      return NextResponse.json(
        { error: "Invalid scheduledAt format. Use ISO 8601 format (e.g., 2026-04-06T09:00:00+09:00)" },
        { status: 400 }
      );
    }

    // Find teacher by name
    const teacher = await prisma.user.findFirst({
      where: {
        name: teacherName,
        role: "senior"
      },
      select: { id: true, role: true, name: true },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: `Teacher not found with name: ${teacherName}` },
        { status: 404 }
      );
    }

    // Calculate end time
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

    // Check for duplicate: same teacher + same start time
    const existingSlot = await prisma.slot.findFirst({
      where: {
        hostId: teacher.id,
        startTime: startTime,
      },
    });

    if (existingSlot) {
      console.log("[/api/slots/create] Duplicate slot detected, skipping:", {
        teacherName,
        startTime,
      });
      return NextResponse.json(
        {
          success: true,
          skipped: true,
          message: "Slot already exists for this teacher and time",
          existingSlot: {
            id: existingSlot.id,
            startTime: existingSlot.startTime,
            endTime: existingSlot.endTime,
          },
        },
        { status: 200 }
      );
    }

    // Create the slot
    const slot = await prisma.slot.create({
      data: {
        hostId: teacher.id,
        sessionType: "both",
        startTime,
        endTime,
        status: "available",
      },
    });

    console.log("[/api/slots/create] Slot created successfully:", slot.id);

    return NextResponse.json(
      {
        success: true,
        skipped: false,
        slot: {
          id: slot.id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          sessionType: slot.sessionType,
          status: slot.status,
        },
        teacher: {
          id: teacher.id,
          name: teacher.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[/api/slots/create] Error:", error);

    // Check for Prisma-specific errors
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string; meta?: unknown };
      console.error("[/api/slots/create] Prisma error:", prismaError.code, prismaError.meta);

      if (prismaError.code === "P2002") {
        return NextResponse.json(
          { error: "Duplicate slot entry" },
          { status: 409 }
        );
      }
      if (prismaError.code === "P2003") {
        return NextResponse.json(
          { error: "Foreign key constraint failed - teacher may not exist" },
          { status: 400 }
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
