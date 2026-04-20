// lib/session-token.ts
// Session token utilities for LINE-based authentication bypass

import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { NextRequest } from "next/server";

/**
 * Generate a secure random token
 */
function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Get client IP address from Next.js request
 * Checks multiple headers to handle proxies and load balancers
 */
export function getClientIp(request: NextRequest): string | undefined {
  // Check x-forwarded-for header (most common for proxies)
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // Take the first IP in the list (client IP)
    return forwardedFor.split(",")[0].trim();
  }

  // Check x-real-ip header (used by some proxies)
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  // Fallback to connection remote address (may be proxy IP)
  const cfConnectingIp = request.headers.get("cf-connecting-ip"); // Cloudflare
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }

  // For Vercel deployments
  const vercelForwardedFor = request.headers.get("x-vercel-forwarded-for");
  if (vercelForwardedFor) {
    return vercelForwardedFor.split(",")[0].trim();
  }

  return undefined;
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
      sessionStartTime,
      accessCount: 0,
    },
  });

  return token;
}

/**
 * Validate and consume a session token with enhanced security
 * Returns user and reservation info if valid, error details if invalid
 *
 * Security features:
 * - Time-based access: 30 minutes before session start (when reminder is sent) to 30 minutes after
 * - IP address tracking: First access IP is recorded and verified (allows same /24 subnet)
 * - Access count limit: Maximum 20 accesses per token
 */
export async function validateSessionToken(
  token: string,
  clientIp?: string
): Promise<{
  userId: string;
  reservationId: string;
  userRole: string;
} | null> {
  const sessionToken = await prisma.sessionToken.findUnique({
    where: { token },
  });

  if (!sessionToken) {
    console.log("[Token Validation] Token not found");
    return null;
  }

  const now = new Date();

  // Check if expired
  if (now > sessionToken.expiresAt) {
    console.log("[Token Validation] Token expired");
    return null;
  }

  // Time-based restriction: Allow access from reminder time (30 min before) to session end
  // Since reminders are sent 30 minutes before, allow access from that point
  const thirtyMinutesBefore = new Date(sessionToken.sessionStartTime.getTime() - 30 * 60 * 1000);

  if (now < thirtyMinutesBefore) {
    console.log("[Token Validation] Too early - session not started yet");
    return null;
  }

  // Allow access until session end (sessions are 25 minutes, allow 5 min buffer)
  const sessionEndTime = new Date(sessionToken.sessionStartTime.getTime() + 30 * 60 * 1000);
  if (now > sessionEndTime) {
    console.log("[Token Validation] Session ended");
    return null;
  }

  // Access count limit (20 times max to prevent abuse while allowing refreshes)
  if (sessionToken.accessCount >= 20) {
    console.log("[Token Validation] Access count limit exceeded");
    return null;
  }

  // IP address validation (if provided)
  if (clientIp) {
    if (sessionToken.firstAccessIp) {
      // Compare with first access IP
      if (!isSimilarIp(sessionToken.firstAccessIp, clientIp)) {
        console.log("[Token Validation] IP address mismatch", {
          first: sessionToken.firstAccessIp,
          current: clientIp,
        });
        return null;
      }
    }
  }

  // Get user role
  const user = await prisma.user.findUnique({
    where: { id: sessionToken.userId },
    select: { role: true },
  });

  if (!user) {
    console.log("[Token Validation] User not found");
    return null;
  }

  // Update token usage
  await prisma.sessionToken.update({
    where: { id: sessionToken.id },
    data: {
      usedAt: sessionToken.usedAt || now,
      firstAccessIp: sessionToken.firstAccessIp || clientIp,
      lastAccessIp: clientIp,
      accessCount: { increment: 1 },
    },
  });

  console.log("[Token Validation] Success", {
    userId: sessionToken.userId,
    accessCount: sessionToken.accessCount + 1,
  });

  return {
    userId: sessionToken.userId,
    reservationId: sessionToken.reservationId,
    userRole: user.role,
  };
}

/**
 * Check if two IP addresses are similar enough to be considered the same user
 * Allows for mobile network IP changes within the same subnet
 */
function isSimilarIp(ip1: string, ip2: string): boolean {
  // Exact match
  if (ip1 === ip2) {
    return true;
  }

  // For IPv4: Compare first 3 octets (same /24 subnet)
  // This allows mobile network IP changes within the same cell tower
  const parts1 = ip1.split(".");
  const parts2 = ip2.split(".");

  if (parts1.length === 4 && parts2.length === 4) {
    // Check if first 3 octets match (e.g., 192.168.1.x)
    return (
      parts1[0] === parts2[0] &&
      parts1[1] === parts2[1] &&
      parts1[2] === parts2[2]
    );
  }

  // For IPv6 or other formats: Require exact match
  return false;
}

/**
 * Get the base URL for the application
 * Ensures consistent URL formatting across all services
 */
export function getBaseUrl(): string {
  const rawUrl = process.env.NEXTAUTH_URL;
  if (!rawUrl) {
    throw new Error(
      "NEXTAUTH_URL environment variable is not set. Please configure it in your environment."
    );
  }
  // Remove trailing slashes to prevent double slashes in URLs
  return rawUrl.replace(/\/+$/, "");
}

/**
 * Build session URL with token for LINE notification
 */
export function buildSessionUrl(token: string): string {
  return `${getBaseUrl()}/session/join?token=${token}`;
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
