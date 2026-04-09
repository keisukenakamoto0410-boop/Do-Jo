import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Get all reservations for admin
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin role
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Access denied - Admin only" }, { status: 403 });
    }

    // Get all confirmed reservations with future start times
    const reservations = await prisma.reservation.findMany({
      where: {
        status: { in: ["confirmed", "pending"] },
      },
      include: {
        slot: true,
        host: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        learner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            country: true,
            jlptLevel: true,
          },
        },
      },
      orderBy: {
        slot: {
          startTime: "asc",
        },
      },
    });

    return NextResponse.json({ reservations });
  } catch (error) {
    console.error("Failed to fetch admin reservations:", error);
    return NextResponse.json(
      { error: "Failed to fetch reservations" },
      { status: 500 }
    );
  }
}
