import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const isLearner = session.user.role === "learner";

    // Get user stats
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        totalTalkTime: true,
        totalSessions: true,
        uniquePartners: true,
        consecutiveDays: true,
        lastConversationDate: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get this week's dates
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    // Get this month's start
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get completed reservations for this week
    const weeklyReservations = await prisma.reservation.findMany({
      where: {
        ...(isLearner ? { learnerId: userId } : { hostId: userId }),
        status: "completed",
        completedAt: {
          gte: startOfWeek,
          lt: endOfWeek,
        },
      },
      include: {
        slot: true,
      },
    });

    // Calculate weekly stats (25 minutes per session)
    const weeklyStats = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];

      const dayMinutes = weeklyReservations
        .filter((r) => {
          const completedDate = r.completedAt ? new Date(r.completedAt) : null;
          if (!completedDate) return false;
          return completedDate.toISOString().split("T")[0] === dateStr;
        })
        .length * 25;

      weeklyStats.push({
        date: dateStr,
        minutes: dayMinutes,
      });
    }

    // Get this month's total
    const monthlyReservations = await prisma.reservation.count({
      where: {
        ...(isLearner ? { learnerId: userId } : { hostId: userId }),
        status: "completed",
        completedAt: {
          gte: startOfMonth,
        },
      },
    });

    const monthlyMinutes = monthlyReservations * 25;

    // Count unique partners
    const uniquePartnersData = await prisma.reservation.findMany({
      where: {
        ...(isLearner ? { learnerId: userId } : { hostId: userId }),
        status: "completed",
      },
      select: isLearner ? { hostId: true } : { learnerId: true },
      distinct: isLearner ? ["hostId"] : ["learnerId"],
    });

    return NextResponse.json({
      totalMinutes: user.totalTalkTime,
      totalSessions: user.totalSessions,
      uniquePartners: uniquePartnersData.length,
      consecutiveDays: user.consecutiveDays,
      weeklyStats,
      monthlyMinutes,
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
