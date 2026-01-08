import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReminderEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // If no CRON_SECRET is set, allow in development
  if (!cronSecret) {
    return process.env.NODE_ENV === "development";
  }

  return authHeader === `Bearer ${cronSecret}`;
}

// GET: Send reminder emails for sessions starting in ~30 minutes
export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    if (!verifyCronSecret(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    // Sessions starting between 25-35 minutes from now
    const minTime = new Date(now.getTime() + 25 * 60000);
    const maxTime = new Date(now.getTime() + 35 * 60000);

    // Find reservations that need reminders
    const reservations = await prisma.reservation.findMany({
      where: {
        status: "confirmed",
        reminderSent: false,
        slot: {
          startTime: {
            gte: minTime,
            lte: maxTime,
          },
        },
      },
      include: {
        slot: true,
        host: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        learner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    console.log(
      `Found ${reservations.length} reservations needing reminders`
    );

    const BASE_URL = process.env.NEXTAUTH_URL || "https://do-jo.vercel.app";
    const results: {
      reservationId: string;
      hostEmail: boolean;
      learnerEmail: boolean;
    }[] = [];

    for (const reservation of reservations) {
      const sessionUrl = `${BASE_URL}/host/session/${reservation.id}`;
      const learnerSessionUrl = `${BASE_URL}/learner/session/${reservation.id}`;

      // Send reminder to host
      const hostResult = await sendReminderEmail({
        email: reservation.host.email!,
        name: reservation.host.name,
        partnerName: reservation.learner.name,
        sessionDate: reservation.slot.startTime,
        sessionUrl,
        isHost: true,
      });

      // Send reminder to learner
      const learnerResult = await sendReminderEmail({
        email: reservation.learner.email!,
        name: reservation.learner.name,
        partnerName: reservation.host.name,
        sessionDate: reservation.slot.startTime,
        sessionUrl: learnerSessionUrl,
        isHost: false,
      });

      // Mark reminder as sent
      await prisma.reservation.update({
        where: { id: reservation.id },
        data: { reminderSent: true },
      });

      results.push({
        reservationId: reservation.id,
        hostEmail: hostResult.success,
        learnerEmail: learnerResult.success,
      });
    }

    return NextResponse.json({
      success: true,
      processed: reservations.length,
      results,
    });
  } catch (error) {
    console.error("Reminder cron error:", error);
    return NextResponse.json(
      { error: "Failed to process reminders" },
      { status: 500 }
    );
  }
}
