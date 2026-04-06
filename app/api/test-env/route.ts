import { NextResponse } from "next/server";

// Temporary endpoint to check if LINE_CHANNEL_ACCESS_TOKEN is available in production
export async function GET() {
  const hasToken = !!process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const tokenLength = process.env.LINE_CHANNEL_ACCESS_TOKEN?.length || 0;

  return NextResponse.json({
    hasLineToken: hasToken,
    tokenLength: tokenLength,
    tokenPrefix: process.env.LINE_CHANNEL_ACCESS_TOKEN?.substring(0, 10) || "none",
  });
}
