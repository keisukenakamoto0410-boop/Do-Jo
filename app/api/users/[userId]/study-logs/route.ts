import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { userId } = await params;

    // Only allow users to view their own study logs or admin to view anyone's
    if (session?.user?.id !== userId && session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "12");

    const studyLogs = await prisma.studyLog.findMany({
      where: {
        learnerId: userId,
      },
      include: {
        reservation: {
          include: {
            host: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: {
        uploadedAt: "desc",
      },
      take: limit,
    });

    return NextResponse.json({ studyLogs });
  } catch (error) {
    console.error("Failed to fetch study logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch study logs" },
      { status: 500 }
    );
  }
}
