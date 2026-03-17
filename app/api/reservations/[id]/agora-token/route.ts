import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RtcTokenBuilder, RtcRole } from "agora-access-token";
import { validateSessionToken, getClientIp } from "@/lib/session-token";

// Admin emails for access control
const ADMIN_EMAILS = ["keisuke.mjugaad91@gmail.com"];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reservationId } = await params;
    const { searchParams } = new URL(request.url);

    // Try token-based authentication first (for LINE users)
    const authHeader = request.headers.get("Authorization");
    const sessionToken = authHeader?.replace("Bearer ", "") || searchParams.get("token");

    let userId: string | null = null;
    let userRole: string | null = null;

    if (sessionToken) {
      // Validate session token with IP address verification
      const clientIp = getClientIp(request);
      const tokenData = await validateSessionToken(sessionToken, clientIp);
      if (tokenData && tokenData.reservationId === reservationId) {
        userId = tokenData.userId;
        userRole = tokenData.userRole;
      }
    }

    // Fall back to NextAuth session if no token
    if (!userId) {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = session.user.id;
      userRole = session.user.role;
    }

    const role = searchParams.get("role");
    const isAdmin = role === "admin" && userRole === "admin";

    // 予約確認
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    // ユーザーが参加者または管理者か確認
    if (
      reservation.learnerId !== userId &&
      reservation.hostId !== userId &&
      !isAdmin
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      console.error("Agora credentials not configured");
      return NextResponse.json(
        { error: "Video call service not configured" },
        { status: 500 }
      );
    }

    const channelName = `session-${reservationId}`;
    // 管理者は異なるUID範囲を使用（衝突を避けるため）
    const uid = isAdmin ? 9000 + Math.floor(Math.random() * 1000) : 0;
    const rtcRole = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600; // 1 hour
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // トークン生成
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      rtcRole,
      privilegeExpiredTs
    );

    return NextResponse.json({
      token,
      channelName,
      appId,
      uid,
    });
  } catch (error) {
    console.error("Agora token generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}
