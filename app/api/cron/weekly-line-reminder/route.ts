import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendLinePushMessageToMultiple } from "@/lib/line";

/**
 * Weekly LINE reminder for hosts
 * Sends a reminder to create availability slots
 *
 * POST /api/cron/weekly-line-reminder
 *
 * Security: Protected by CRON_SECRET
 * Schedule: Every Sunday (configure in Vercel Cron or external scheduler)
 */
export async function POST(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("[CRON] CRON_SECRET is not configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error("[CRON] Invalid authorization");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get all hosts (seniors and students) with LINE ID
    const hostsWithLineId = await prisma.user.findMany({
      where: {
        role: { in: ["senior", "student"] },
        lineId: { not: null },
      },
      select: {
        id: true,
        name: true,
        lineId: true,
      },
    });

    if (hostsWithLineId.length === 0) {
      console.log("[CRON] No hosts with LINE ID found");
      return NextResponse.json({
        success: true,
        message: "No hosts with LINE ID found",
        total: 0,
        sent: 0,
        failed: 0,
      });
    }

    // Prepare message
    const message = `今週の予約枠を作りませんか？\nhttps://do-jo.vercel.app/senior/schedule`;

    // Send LINE messages
    const users = hostsWithLineId
      .filter((host): host is { id: string; name: string; lineId: string } => host.lineId !== null)
      .map((host) => ({
        lineId: host.lineId,
        name: host.name,
      }));

    const result = await sendLinePushMessageToMultiple(users, message);

    console.log("[CRON] Weekly LINE reminder completed:", {
      total: result.total,
      success: result.success,
      failed: result.failed,
    });

    return NextResponse.json({
      success: true,
      message: "Weekly LINE reminder sent",
      total: result.total,
      sent: result.success,
      failed: result.failed,
      details: result.results.map((r) => ({
        name: r.name,
        success: r.success,
        error: r.error,
      })),
    });
  } catch (error) {
    console.error("[CRON] Weekly LINE reminder error:", error);
    return NextResponse.json(
      {
        error: "Failed to send weekly LINE reminder",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Also support GET for Vercel Cron (which uses GET by default)
export async function GET(req: NextRequest) {
  return POST(req);
}
