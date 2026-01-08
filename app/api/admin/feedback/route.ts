import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Admin emails that can access this endpoint
const ADMIN_EMAILS = ["nakamoto.keisuke.vx@gmail.com"];

// GET: Get all learners with their feedback stats (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    if (!ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const learnerId = searchParams.get("learnerId");

    // If learnerId is provided, get detailed feedback for that learner
    if (learnerId) {
      const learner = await prisma.user.findUnique({
        where: { id: learnerId },
        select: {
          id: true,
          name: true,
          email: true,
          jlptLevel: true,
          country: true,
          totalSessions: true,
          createdAt: true,
        },
      });

      if (!learner) {
        return NextResponse.json(
          { error: "Learner not found" },
          { status: 404 }
        );
      }

      // Get all feedback for this learner
      const feedbacks = await prisma.sessionFeedback.findMany({
        where: {
          reservation: {
            learnerId: learnerId,
          },
        },
        include: {
          reservation: {
            include: {
              host: { select: { name: true } },
              slot: { select: { startTime: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // Calculate average scores
      const totalFeedbacks = feedbacks.length;
      const avgScore =
        totalFeedbacks > 0
          ? feedbacks.reduce((sum, f) => sum + f.totalScore, 0) / totalFeedbacks
          : 0;

      // Get latest level
      const latestLevel = feedbacks[0]?.level || "-";

      return NextResponse.json({
        learner: {
          ...learner,
          avgScore: Math.round(avgScore * 10) / 10,
          latestLevel,
          feedbackCount: totalFeedbacks,
        },
        feedbacks: feedbacks.map((f) => ({
          id: f.id,
          sessionDate: f.reservation.slot.startTime,
          hostName: f.reservation.host.name,
          q1: f.q1Accurate,
          q2: f.q2Keigo,
          q3: f.q3Naturalness,
          q4: f.q4NativeFeel,
          totalScore: f.totalScore,
          level: f.level,
          message: f.message,
          createdAt: f.createdAt,
        })),
      });
    }

    // Get all learners with feedback stats
    const learners = await prisma.user.findMany({
      where: { role: "learner" },
      select: {
        id: true,
        name: true,
        email: true,
        jlptLevel: true,
        country: true,
        totalSessions: true,
        reservationsAsLearner: {
          select: {
            sessionFeedback: {
              select: {
                totalScore: true,
                level: true,
                createdAt: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Process learners to calculate stats
    const learnersWithStats = learners.map((learner) => {
      const feedbacks = learner.reservationsAsLearner
        .map((r) => r.sessionFeedback)
        .filter((f): f is NonNullable<typeof f> => f !== null);

      const totalFeedbacks = feedbacks.length;
      const avgScore =
        totalFeedbacks > 0
          ? feedbacks.reduce((sum, f) => sum + f.totalScore, 0) / totalFeedbacks
          : 0;

      // Get latest level (from most recent feedback)
      const sortedFeedbacks = [...feedbacks].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const latestLevel = sortedFeedbacks[0]?.level || "-";

      return {
        id: learner.id,
        name: learner.name,
        email: learner.email,
        jlptLevel: learner.jlptLevel,
        country: learner.country,
        totalSessions: learner.totalSessions,
        feedbackCount: totalFeedbacks,
        avgScore: Math.round(avgScore * 10) / 10,
        latestLevel,
      };
    });

    // Sort by average score descending
    learnersWithStats.sort((a, b) => b.avgScore - a.avgScore);

    return NextResponse.json({ learners: learnersWithStats });
  } catch (error) {
    console.error("Failed to fetch admin feedback:", error);
    return NextResponse.json(
      { error: "Failed to fetch feedback data" },
      { status: 500 }
    );
  }
}
