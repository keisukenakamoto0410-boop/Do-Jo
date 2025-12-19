import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST request a payout
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only students can request payouts
    if (session.user.role !== "student") {
      return NextResponse.json(
        { error: "Only students can request payouts" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { amount } = body;

    if (!amount || amount < 1000) {
      return NextResponse.json(
        { error: "Minimum payout amount is ¥1,000" },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Check available balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { totalEarnings: true },
    });

    const paidOutTotal = await prisma.payout.aggregate({
      where: {
        userId: userId,
        status: { in: ["pending", "completed"] },
      },
      _sum: {
        amount: true,
      },
    });

    const availableBalance = (user?.totalEarnings || 0) - (paidOutTotal._sum.amount || 0);

    if (amount > availableBalance) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    // Create payout request
    const payout = await prisma.payout.create({
      data: {
        userId,
        amount,
        sessions: 0, // Will be calculated based on actual completed sessions
        status: "pending",
      },
    });

    return NextResponse.json({ payout }, { status: 201 });
  } catch (error) {
    console.error("Error creating payout:", error);
    return NextResponse.json(
      { error: "Failed to create payout request" },
      { status: 500 }
    );
  }
}
