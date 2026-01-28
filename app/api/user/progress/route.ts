import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Badge definitions
const BADGES = {
  first_step: {
    id: "first_step",
    name: "First Step",
    emoji: "🌱",
    description: "Completed your first session",
    requirement: 1,
  },
  on_fire: {
    id: "on_fire",
    name: "On Fire",
    emoji: "🔥",
    description: "3 weeks in a row",
    requirement: 3,
  },
  chatterbox: {
    id: "chatterbox",
    name: "Chatterbox",
    emoji: "💬",
    description: "10 sessions completed",
    requirement: 10,
  },
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get completed reservations for the learner
    const completedReservations = await prisma.reservation.findMany({
      where: {
        learnerId: userId,
        status: "completed",
      },
      select: {
        id: true,
        completedAt: true,
        slot: {
          select: {
            startTime: true,
          },
        },
      },
      orderBy: {
        completedAt: "desc",
      },
    });

    const totalSessions = completedReservations.length;

    // Calculate weekly streak
    // A week counts if there's at least one completed session in that week
    const weeklyStreak = calculateWeeklyStreak(completedReservations);

    // Determine earned badges
    const earnedBadges: Array<{
      id: string;
      name: string;
      emoji: string;
      description: string;
      requirement: number;
      earned: boolean;
      earnedAt: Date | null | undefined;
    }> = [];

    // First Step: completed at least 1 session
    if (totalSessions >= BADGES.first_step.requirement) {
      earnedBadges.push({
        ...BADGES.first_step,
        earned: true,
        earnedAt: completedReservations[completedReservations.length - 1]?.completedAt,
      });
    }

    // On Fire: 3 consecutive weeks
    if (weeklyStreak >= BADGES.on_fire.requirement) {
      earnedBadges.push({
        ...BADGES.on_fire,
        earned: true,
        earnedAt: new Date(), // Current achievement
      });
    }

    // Chatterbox: 10 sessions
    if (totalSessions >= BADGES.chatterbox.requirement) {
      // Find when they completed their 10th session
      const tenthSession = completedReservations[completedReservations.length - BADGES.chatterbox.requirement];
      earnedBadges.push({
        ...BADGES.chatterbox,
        earned: true,
        earnedAt: tenthSession?.completedAt,
      });
    }

    // All badges with earned status
    const allBadges = Object.values(BADGES).map((badge) => {
      const earned = earnedBadges.find((eb) => eb.id === badge.id);
      return {
        ...badge,
        earned: !!earned,
        earnedAt: earned?.earnedAt || null,
        progress: getBadgeProgress(badge.id, totalSessions, weeklyStreak),
      };
    });

    return NextResponse.json({
      totalSessions,
      weeklyStreak,
      badges: allBadges,
      earnedBadgeCount: earnedBadges.length,
    });
  } catch (error) {
    console.error("Error fetching user progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    );
  }
}

// Calculate consecutive weeks with at least one session
function calculateWeeklyStreak(
  reservations: { completedAt: Date | null; slot: { startTime: Date } }[]
): number {
  if (reservations.length === 0) return 0;

  // Get current week start (Sunday)
  const now = new Date();
  const currentWeekStart = getWeekStart(now);

  // Group sessions by week
  const sessionsByWeek = new Map<string, boolean>();

  for (const reservation of reservations) {
    const sessionDate = reservation.completedAt || reservation.slot.startTime;
    const weekStart = getWeekStart(new Date(sessionDate));
    const weekKey = weekStart.toISOString().split("T")[0];
    sessionsByWeek.set(weekKey, true);
  }

  // Count consecutive weeks from current week backwards
  let streak = 0;
  let checkWeek = new Date(currentWeekStart);

  // Check if current week has a session
  const currentWeekKey = currentWeekStart.toISOString().split("T")[0];
  const hasCurrentWeekSession = sessionsByWeek.has(currentWeekKey);

  // If no session this week, start checking from last week
  if (!hasCurrentWeekSession) {
    checkWeek.setDate(checkWeek.getDate() - 7);
  }

  // Count consecutive weeks
  while (true) {
    const weekKey = checkWeek.toISOString().split("T")[0];
    if (sessionsByWeek.has(weekKey)) {
      streak++;
      checkWeek.setDate(checkWeek.getDate() - 7);
    } else {
      break;
    }
  }

  return streak;
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getBadgeProgress(
  badgeId: string,
  totalSessions: number,
  weeklyStreak: number
): { current: number; target: number } {
  switch (badgeId) {
    case "first_step":
      return { current: Math.min(totalSessions, 1), target: 1 };
    case "on_fire":
      return { current: Math.min(weeklyStreak, 3), target: 3 };
    case "chatterbox":
      return { current: Math.min(totalSessions, 10), target: 10 };
    default:
      return { current: 0, target: 1 };
  }
}
