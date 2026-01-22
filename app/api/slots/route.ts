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
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only hosts (senior/student) can create slots
    if (session.user.role === "learner") {
      return NextResponse.json(
        { error: "Learners cannot create slots" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { startTime, sessionType } = body;

    if (!startTime || !sessionType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const start = new Date(startTime);
    const end = new Date(start.getTime() + 25 * 60 * 1000); // 25 minutes

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
      return NextResponse.json(
        { error: "Slot overlaps with existing slot" },
        { status: 409 }
      );
    }

    const slot = await prisma.slot.create({
      data: {
        hostId: session.user.id,
        sessionType,
        startTime: start,
        endTime: end,
        status: "available",
      },
    });

    return NextResponse.json({ slot }, { status: 201 });
  } catch (error) {
    console.error("Error creating slot:", error);
    return NextResponse.json(
      { error: "Failed to create slot" },
      { status: 500 }
    );
  }
}
