import { NextRequest, NextResponse } from "next/server";
import { RtcTokenBuilder, RtcRole } from "agora-access-token";

// テスト用のトークン生成API（認証不要）
export async function POST(request: NextRequest) {
  try {
    const { channelName, uid } = await request.json();

    if (!channelName) {
      return NextResponse.json(
        { error: "Channel name is required" },
        { status: 400 }
      );
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

    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600; // 1 hour
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // トークン生成
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid || 0,
      role,
      privilegeExpiredTs
    );

    return NextResponse.json({
      token,
      channelName,
      appId,
      uid: uid || 0,
    });
  } catch (error) {
    console.error("Agora token generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}
