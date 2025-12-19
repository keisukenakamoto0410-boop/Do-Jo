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

    // Filter by date
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      where.startTime = {
        gte: startOfDay,
        lte: endOfDay,
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
