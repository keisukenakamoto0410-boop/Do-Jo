import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pushMessage } from "@/lib/line/messaging";
import { buildWeeklyReminderMessage } from "@/lib/line/flex-templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Weekly LINE reminder for hosts
 * Sends a Flex Message reminder to register schedule
 *
 * GET /api/cron/weekly-line-reminder
 *
 * Security: Protected by CRON_SECRET
 * Schedule: Every Sunday 10:00 JST (1:00 UTC)
 */
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
    // Get all seniors with LINE ID
    const hostsWithLineId = await prisma.user.findMany({
      where: {
        role: "senior",
        lineId: { not: null },
      },
      select: {
        id: true,
        name: true,
        lineId: true,
      },
    });

    console.log(
      `[Weekly Reminder] Found ${hostsWithLineId.length} hosts with LINE ID`
    );

    if (hostsWithLineId.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No hosts with LINE ID found",
        total: 0,
        sent: 0,
        failed: 0,
      });
    }

    let sentCount = 0;
    let failedCount = 0;

    // Send Flex Message to each host
    for (const host of hostsWithLineId) {
      if (!host.lineId) continue;

      try {
        await pushMessage(host.lineId, buildWeeklyReminderMessage());
        sentCount++;
        console.log(
          `[Weekly Reminder] Sent to ${host.name} (${host.lineId})`
        );
      } catch (error) {
        failedCount++;
        console.error(
          `[Weekly Reminder] Failed to send to ${host.name}:`,
          error
        );
      }
    }

    console.log(
      `[Weekly Reminder] Completed: sent=${sentCount}, failed=${failedCount}`
    );

    return NextResponse.json({
      success: true,
      total: hostsWithLineId.length,
      sent: sentCount,
      failed: failedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Weekly Reminder] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
