// app/api/cron/session-reminder/route.ts
// Cron job to send LINE reminders 30 minutes before sessions

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pushMessage } from "@/lib/line/messaging";
import { buildSessionInfoMessage } from "@/lib/line/flex-templates";
import { createSessionToken, buildSessionUrl } from "@/lib/session-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Verify cron secret for security (Vercel Cron sets this header)
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const thirtyMinLater = new Date(now.getTime() + 30 * 60 * 1000);
    const thirtyFiveMinLater = new Date(now.getTime() + 35 * 60 * 1000);

    // Find sessions starting in 30-35 minutes that haven't had reminders sent
    const upcomingReservations = await prisma.reservation.findMany({
      where: {
        slot: {
          startTime: {
            gte: thirtyMinLater,
            lt: thirtyFiveMinLater,
          },
        },
        status: { in: ["pending", "active"] },
        reminderSent: false,
      },
      include: {
        slot: true,
        host: {
          select: {
            id: true,
            name: true,
            lineId: true,
          },
        },
        learner: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    console.log(
      `[Session Reminder] Found ${upcomingReservations.length} upcoming sessions`
    );

    let notifiedCount = 0;

    for (const reservation of upcomingReservations) {
      const host = reservation.host;

      // Send LINE notification to host if they have a LINE ID
      if (host?.lineId) {
        try {
          // Create one-time token for session join (expires 1 hour after session start)
          const token = await createSessionToken(
            reservation.id,
            host.id,
            reservation.slot.startTime
          );
          const sessionUrl = buildSessionUrl(token);

          // Parse target words from reservation
          const targetWords = reservation.targetWords || [];

          await pushMessage(
            host.lineId,
            buildSessionInfoMessage({
              learnerName: reservation.learner.name,
              topic: reservation.selectedTopic || "日常会話",
              targetWords: targetWords.length > 0 ? targetWords : undefined,
              sessionUrl,
            })
          );

          console.log(
            `[Session Reminder] Sent notification to host ${host.name} (${host.lineId}) with token`
          );
          notifiedCount++;
        } catch (error) {
          console.error(
            `[Session Reminder] Failed to send notification to host ${host.id}:`,
            error
          );
        }
      }

      // Mark reminder as sent
      await prisma.reservation.update({
        where: { id: reservation.id },
        data: { reminderSent: true },
      });
    }

    console.log(
      `[Session Reminder] Notified ${notifiedCount} hosts out of ${upcomingReservations.length} reservations`
    );

    return NextResponse.json({
      success: true,
      found: upcomingReservations.length,
      notified: notifiedCount,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("[Session Reminder] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
