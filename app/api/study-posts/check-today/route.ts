import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    console.log("🔍 check-today: Starting...");
    console.log("🔍 check-today: prisma object:", typeof prisma);
    console.log("🔍 check-today: prisma.studyPost:", typeof prisma?.studyPost);

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      console.log("❌ check-today: Unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🔍 check-today: User ID:", session.user.id);

    // Check if user already posted today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log("📅 check-today: Date range:", today.toISOString(), "to", tomorrow.toISOString());

    const existingPost = await prisma.studyPost.findFirst({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    console.log("📝 check-today: Existing post found:", !!existingPost);

    // Get user stats
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        totalPosts: true,
      },
    });

    console.log("👤 check-today: User stats:", user);

    const totalPosts = user?.totalPosts || 0;

    console.log("✅ check-today: Success");

    return NextResponse.json({
      hasPostedToday: !!existingPost,
      todayPost: existingPost,
      totalPosts,
    });
  } catch (error) {
    console.error("❌ check-today: Error:", error);
    console.error("❌ check-today: Error message:", error instanceof Error ? error.message : "Unknown");
    console.error("❌ check-today: Error stack:", error instanceof Error ? error.stack : "");
    return NextResponse.json(
      {
        error: "確認に失敗しました",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
