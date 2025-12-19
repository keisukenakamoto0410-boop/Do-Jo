import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET earnings stats for the current host
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only students have earnings
    if (session.user.role !== "student") {
      return NextResponse.json(
        { error: "Only students can access earnings" },
        { status: 403 }
      );
    }

    const userId = session.user.id;

    // Get user's total earnings from profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { totalEarnings: true },
    });

    // Get completed sessions count
    const completedSessions = await prisma.reservation.count({
      where: {
        hostId: userId,
        status: "completed",
      },
    });

    // Get this month's sessions and earnings
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthlyReservations = await prisma.reservation.findMany({
      where: {
        hostId: userId,
        status: "completed",
        completedAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    const monthlySessions = monthlyReservations.length;
    // Assuming ¥700 average per session
    const monthlyEarnings = monthlySessions * 700;

    // Get pending payout (total earnings minus already paid out)
    const paidOutTotal = await prisma.payout.aggregate({
      where: {
        userId: userId,
        status: "completed",
      },
      _sum: {
        amount: true,
      },
    });

    const pendingPayout = (user?.totalEarnings || 0) - (paidOutTotal._sum.amount || 0);

    // Get payout history
    const payouts = await prisma.payout.findMany({
      where: { userId },
      orderBy: { requestedAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      stats: {
        totalEarnings: user?.totalEarnings || 0,
        monthlyEarnings,
        pendingPayout: Math.max(0, pendingPayout),
        completedSessions,
        monthlySessions,
      },
      payouts,
    });
  } catch (error) {
    console.error("Error fetching earnings:", error);
    return NextResponse.json(
      { error: "Failed to fetch earnings" },
      { status: 500 }
    );
  }
}
