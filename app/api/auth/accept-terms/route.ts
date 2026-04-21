import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    console.log("[Accept Terms API] Request received");
    const session = await getServerSession(authOptions);

    console.log("[Accept Terms API] Session:", {
      hasSession: !!session,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      userRole: session?.user?.role,
    });

    if (!session || !session.user?.email) {
      console.log("[Accept Terms API] Unauthorized - no session or email");
      return NextResponse.json(
        { error: "Unauthorized - Please log in first" },
        { status: 401 }
      );
    }

    console.log("[Accept Terms API] Updating user:", session.user.email);

    // Update user's termsAccepted status
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        termsAccepted: true,
        termsAcceptedAt: new Date(),
      },
    });

    console.log("[Accept Terms API] User updated successfully:", {
      userId: updatedUser.id,
      termsAccepted: updatedUser.termsAccepted,
      termsAcceptedAt: updatedUser.termsAcceptedAt,
    });

    return NextResponse.json({
      success: true,
      message: "Terms accepted successfully",
    });
  } catch (error) {
    console.error("[Accept Terms API] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to accept terms",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
