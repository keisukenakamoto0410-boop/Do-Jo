import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET available slots with optional filters
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionType = searchParams.get("type"); // "business" | "casual" | "both"
    const date = searchParams.get("date"); // YYYY-MM-DD

    const now = new Date();

    // Build where clause
    const where: Record<string, unknown> = {
      status: "available",
      reservation: null, // No existing reservation
    };

    // Filter by session type
    if (sessionType && sessionType !== "both") {
      where.sessionType = sessionType;
    }

    // Filter by date or default to future slots
    // Use JST (UTC+9) for date filtering since hosts are in Japan
    if (date) {
      // Parse date as JST (Japan Standard Time)
      // date format is YYYY-MM-DD
      const [year, month, day] = date.split("-").map(Number);

      // Create start of day in JST (JST = UTC+9, so subtract 9 hours to get UTC)
      const startOfDayJST = new Date(Date.UTC(year, month - 1, day, -9, 0, 0, 0));
      const endOfDayJST = new Date(Date.UTC(year, month - 1, day, 14, 59, 59, 999)); // 23:59:59.999 JST = 14:59:59 UTC

      // If date includes today's range and now is within it, use current time as minimum
      if (startOfDayJST <= now && now <= endOfDayJST) {
        where.startTime = {
          gte: now,
          lte: endOfDayJST,
        };
      } else {
        where.startTime = {
          gte: startOfDayJST,
          lte: endOfDayJST,
        };
      }
    } else {
      // Default: show all future slots
      where.startTime = {
        gte: now,
      };
    }

    console.log("[/api/slots] Query where:", JSON.stringify(where, null, 2));

    const slots = await prisma.slot.findMany({
      where,
      include: {
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
            totalSessions: true,
            // Senior specific
            careerHistory: true,
            expertise: true,
            // Student specific
            university: true,
            major: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    console.log("[/api/slots] Found", slots.length, "slots");
    return NextResponse.json({ slots });
  } catch (error) {
    console.error("Error fetching slots:", error);
    return NextResponse.json(
      { error: "Failed to fetch slots" },
      { status: 500 }
    );
  }
}

// POST create a new slot (for hosts)
export async function POST(req: NextRequest) {
  try {
    console.log("[/api/slots POST] Starting slot creation...");

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log("[/api/slots POST] No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[/api/slots POST] User:", {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
    });

    // Only hosts (senior/student) can create slots
    if (session.user.role === "learner") {
      console.log("[/api/slots POST] Learner tried to create slot");
      return NextResponse.json(
        { error: "Learners cannot create slots" },
        { status: 403 }
      );
    }

    // Verify user exists in database
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, role: true, name: true },
    });

    if (!dbUser) {
      console.error("[/api/slots POST] User not found in database:", session.user.id);
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    console.log("[/api/slots POST] DB User found:", dbUser);

    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error("[/api/slots POST] Failed to parse request body:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { startTime, sessionType } = body;
    console.log("[/api/slots POST] Request body:", { startTime, sessionType });

    if (!startTime || !sessionType) {
      console.log("[/api/slots POST] Missing required fields:", { startTime, sessionType });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate sessionType
    if (!["business", "casual", "both"].includes(sessionType)) {
      console.log("[/api/slots POST] Invalid sessionType:", sessionType);
      return NextResponse.json(
        { error: "Invalid sessionType. Must be 'business', 'casual', or 'both'" },
        { status: 400 }
      );
    }

    const start = new Date(startTime);

    // Validate date
    if (isNaN(start.getTime())) {
      console.log("[/api/slots POST] Invalid startTime format:", startTime);
      return NextResponse.json(
        { error: "Invalid startTime format" },
        { status: 400 }
      );
    }

    const end = new Date(start.getTime() + 25 * 60 * 1000); // 25 minutes

    console.log("[/api/slots POST] Parsed times:", {
      start: start.toISOString(),
      end: end.toISOString(),
    });

    // Check for overlapping slots
    const existingSlot = await prisma.slot.findFirst({
      where: {
        hostId: session.user.id,
        OR: [
          {
            startTime: { lte: start },
            endTime: { gt: start },
          },
          {
            startTime: { lt: end },
            endTime: { gte: end },
          },
          {
            startTime: { gte: start },
            endTime: { lte: end },
          },
        ],
      },
    });

    if (existingSlot) {
      console.log("[/api/slots POST] Overlapping slot found:", existingSlot.id);
      return NextResponse.json(
        { error: "Slot overlaps with existing slot" },
        { status: 409 }
      );
    }

    console.log("[/api/slots POST] Creating slot in database...");

    const slot = await prisma.slot.create({
      data: {
        hostId: session.user.id,
        sessionType,
        startTime: start,
        endTime: end,
        status: "available",
      },
    });

    console.log("[/api/slots POST] Slot created successfully:", slot.id);

    return NextResponse.json({ slot }, { status: 201 });
  } catch (error) {
    // Detailed error logging
    console.error("[/api/slots POST] Error creating slot:");
    console.error("  Error name:", error instanceof Error ? error.name : "Unknown");
    console.error("  Error message:", error instanceof Error ? error.message : String(error));
    console.error("  Error stack:", error instanceof Error ? error.stack : "No stack");

    // Check for Prisma-specific errors
    if (error && typeof error === "object" && "code" in error) {
      const prismaError = error as { code: string; meta?: unknown };
      console.error("  Prisma error code:", prismaError.code);
      console.error("  Prisma error meta:", prismaError.meta);

      // Return more specific error messages for known Prisma errors
      if (prismaError.code === "P2002") {
        return NextResponse.json(
          { error: "Duplicate slot entry" },
          { status: 409 }
        );
      }
      if (prismaError.code === "P2003") {
        return NextResponse.json(
          { error: "Foreign key constraint failed - user may not exist" },
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
