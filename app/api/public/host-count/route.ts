import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// This is a public API endpoint - no authentication required
export async function GET() {
  try {
    // Count all hosts (seniors and students)
    const hostCount = await prisma.user.count({
      where: {
        role: { in: ["senior", "student"] },
      },
    });

    return NextResponse.json({
      count: hostCount,
    });
  } catch (error) {
    console.error("Public host count API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch host count", count: 0 },
      { status: 500 }
    );
  }
}
