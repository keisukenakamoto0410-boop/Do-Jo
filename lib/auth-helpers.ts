import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserType } from "@prisma/client";

/**
 * Get the current session on the server side
 */
export async function getSession() {
  return await getServerSession(authOptions);
}

/**
 * Get the current user from the session
 */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated() {
  const session = await getSession();
  return !!session;
}

/**
 * Check if user has a specific user type
 */
export async function hasUserType(userType: UserType) {
  const user = await getCurrentUser();
  return user?.userType === userType;
}

/**
 * Check if user is a candidate
 */
export async function isCandidate() {
  return await hasUserType(UserType.CANDIDATE);
}

/**
 * Check if user is an interviewer
 */
export async function isInterviewer() {
  return await hasUserType(UserType.INTERVIEWER);
}

/**
 * Check if user is an admin
 */
export async function isAdmin() {
  return await hasUserType(UserType.ADMIN);
}

/**
 * Require authentication or throw error
 */
export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

/**
 * Require specific user type or throw error
 */
export async function requireUserType(userType: UserType) {
  const user = await getCurrentUser();
  if (!user || user.userType !== userType) {
    throw new Error("Forbidden");
  }
  return user;
}
