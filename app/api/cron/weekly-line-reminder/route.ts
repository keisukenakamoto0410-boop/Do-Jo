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
 * Schedule: Every Wednesday 10:00 JST (1:00 UTC)
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

    // Deduplicate by LINE ID to prevent sending multiple messages to the same person
    const uniqueLineIds = [
      ...new Set(hostsWithLineId.map((h) => h.lineId).filter(Boolean)),
    ] as string[];

    console.log(
      `[Weekly Reminder] Found ${hostsWithLineId.length} hosts with LINE ID (${uniqueLineIds.length} unique)`
    );

    if (uniqueLineIds.length === 0) {
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

    // Send Flex Message to each unique LINE ID
    for (const lineId of uniqueLineIds) {
      try {
        await pushMessage(lineId, buildWeeklyReminderMessage());
        sentCount++;
        console.log(`[Weekly Reminder] Sent to ${lineId}`);
      } catch (error) {
        failedCount++;
        console.error(`[Weekly Reminder] Failed to send to ${lineId}:`, error);
      }
    }

    console.log(
      `[Weekly Reminder] Completed: sent=${sentCount}, failed=${failedCount}`
    );

    return NextResponse.json({
      success: true,
      total: hostsWithLineId.length,
      uniqueLineIds: uniqueLineIds.length,
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
