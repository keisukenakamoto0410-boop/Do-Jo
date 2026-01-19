import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const medals = await prisma.userMedal.findMany({
      where: { userId: session.user.id },
      orderBy: { earnedAt: "desc" },
    });

    return NextResponse.json({
      medals: medals.map((m) => ({
        type: m.medalType,
        earnedAt: m.earnedAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching medals:", error);
    return NextResponse.json(
      { error: "Failed to fetch medals" },
      { status: 500 }
    );
  }
}
