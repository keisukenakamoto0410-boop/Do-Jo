import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Get all users for admin
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

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");

    // Build where clause
    const where: Record<string, unknown> = {};
    if (role && role !== "all") {
      where.role = role;
    }

    // Get all users
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        jlptLevel: true,
        nativeLanguage: true,
        country: true,
        prefecture: true,
        ageRange: true,
        university: true,
        totalTalkTime: true,
        averageRating: true,
        totalSessions: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get statistics
    const stats = await prisma.user.groupBy({
      by: ["role"],
      _count: {
        id: true,
      },
    });

    const roleStats = stats.reduce(
      (acc, stat) => {
        acc[stat.role] = stat._count.id;
        return acc;
      },
      {} as Record<string, number>
    );

    return NextResponse.json({
      users,
      stats: {
        total: users.length,
        byRole: roleStats,
      },
    });
  } catch (error) {
    console.error("Failed to fetch admin users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
