import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET slots for the current host
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only hosts can view their slots
    if (session.user.role === "learner") {
      return NextResponse.json(
        { error: "Learners cannot access this resource" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    const where: Record<string, unknown> = {
      hostId: session.user.id,
    };

    // Filter by date using JST (UTC+9) since hosts are in Japan
    if (date) {
      const [year, month, day] = date.split("-").map(Number);

      // Create start of day in JST (JST = UTC+9, so subtract 9 hours to get UTC)
      const startOfDayJST = new Date(Date.UTC(year, month - 1, day, -9, 0, 0, 0));
      const endOfDayJST = new Date(Date.UTC(year, month - 1, day, 14, 59, 59, 999)); // 23:59:59.999 JST = 14:59:59 UTC

      where.startTime = {
        gte: startOfDayJST,
        lte: endOfDayJST,
      };
    }

    const slots = await prisma.slot.findMany({
      where,
      include: {
        reservation: {
          include: {
            learner: {
              select: {
                id: true,
                name: true,
                avatar: true,
                country: true,
                nativeLanguage: true,
                jlptLevel: true,
              },
            },
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return NextResponse.json({ slots });
  } catch (error) {
    console.error("Error fetching host slots:", error);
    return NextResponse.json(
      { error: "Failed to fetch slots" },
      { status: 500 }
    );
  }
}
