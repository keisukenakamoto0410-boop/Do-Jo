// lib/session-token.ts
// Session token utilities for LINE-based authentication bypass

import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/**
 * Generate a secure random token
 */
function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Create a session token for LINE notification
 * Token expires 1 hour after session start time
 */
export async function createSessionToken(
  reservationId: string,
  userId: string,
  sessionStartTime: Date
): Promise<string> {
  const token = generateToken();

  // Token expires 1 hour after session start
  const expiresAt = new Date(sessionStartTime.getTime() + 60 * 60 * 1000);

  await prisma.sessionToken.create({
    data: {
      token,
      reservationId,
      userId,
      expiresAt,
    },
  });

  return token;
}

/**
 * Validate and consume a session token
 * Returns user and reservation info if valid, null if invalid
 */
export async function validateSessionToken(token: string): Promise<{
  userId: string;
  reservationId: string;
  userRole: string;
} | null> {
  const sessionToken = await prisma.sessionToken.findUnique({
    where: { token },
  });

  if (!sessionToken) {
    return null;
  }

  // Check if expired
  if (new Date() > sessionToken.expiresAt) {
    return null;
  }

  // Check if already used
  if (sessionToken.usedAt) {
    // Allow re-use within the session (user might refresh page)
    // But still validate expiry
  }

  // Get user role
  const user = await prisma.user.findUnique({
    where: { id: sessionToken.userId },
    select: { role: true },
  });

  if (!user) {
    return null;
  }

  // Mark as used (but allow re-use)
  if (!sessionToken.usedAt) {
    await prisma.sessionToken.update({
      where: { id: sessionToken.id },
      data: { usedAt: new Date() },
    });
  }

  return {
    userId: sessionToken.userId,
    reservationId: sessionToken.reservationId,
    userRole: user.role,
  };
}

/**
 * Build session URL with token for LINE notification
 */
export function buildSessionUrl(token: string): string {
  const baseUrl = process.env.NEXTAUTH_URL || "https://do-jo.vercel.app";
  return `${baseUrl}/session/join?token=${token}`;
}

/**
 * Clean up expired tokens (call periodically)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const result = await prisma.sessionToken.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });
  return result.count;
}
