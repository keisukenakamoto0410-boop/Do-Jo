// app/api/session/validate-token/route.ts
// API endpoint to validate session token

import { NextRequest, NextResponse } from "next/server";
import { validateSessionToken } from "@/lib/session-token";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    const result = await validateSessionToken(token);

    if (!result) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      userId: result.userId,
      reservationId: result.reservationId,
      userRole: result.userRole,
    });
  } catch (error) {
    console.error("[Validate Token] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
