import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET reservations for the current host
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only hosts can view their reservations
    if (session.user.role === "learner") {
      return NextResponse.json(
        { error: "Learners cannot access this resource" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const limit = searchParams.get("limit");

    const where: Record<string, unknown> = {
      slot: {
        hostId: session.user.id,
      },
    };

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Only future reservations
    where.slot = {
      ...where.slot as object,
      startTime: {
        gte: new Date(),
      },
    };

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        slot: true,
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
        studyLogs: {
          orderBy: {
            uploadedAt: "desc",
          },
          take: 3,
        },
      },
      orderBy: {
        slot: {
          startTime: "asc",
        },
      },
      take: limit ? parseInt(limit, 10) : undefined,
    });

    return NextResponse.json({ reservations });
  } catch (error) {
    console.error("Error fetching host reservations:", error);
    return NextResponse.json(
      { error: "Failed to fetch reservations" },
      { status: 500 }
    );
  }
}
