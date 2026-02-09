import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendLinePushMessage } from "@/lib/line";

// GET - Test LINE notification
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user with lineId
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, lineId: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check environment variables
    const hasAccessToken = !!process.env.LINE_CHANNEL_ACCESS_TOKEN;
    const hasChannelSecret = !!process.env.LINE_CHANNEL_SECRET;

    const diagnostics = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        lineId: user.lineId || null,
        hasLineConnected: !!user.lineId,
      },
      environment: {
        LINE_CHANNEL_ACCESS_TOKEN: hasAccessToken ? "SET" : "NOT SET",
        LINE_CHANNEL_SECRET: hasChannelSecret ? "SET" : "NOT SET",
      },
    };

    // If user has LINE connected, try to send a test message
    if (user.lineId) {
      console.log("[LINE Test] Sending test message to:", user.lineId);
      const result = await sendLinePushMessage(
        user.lineId,
        `【Do Jo テスト】\n\n${user.name}さん、LINE通知のテストです。\n\nこのメッセージが届いていれば、LINE連携は正常に機能しています！`
      );

      return NextResponse.json({
        ...diagnostics,
        testResult: result,
      });
    }

    return NextResponse.json({
      ...diagnostics,
      testResult: {
        success: false,
        error: "LINE not connected. Please send your email to the LINE bot first.",
      },
    });
  } catch (error) {
    console.error("[LINE Test] Error:", error);
    return NextResponse.json(
      { error: "Test failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
