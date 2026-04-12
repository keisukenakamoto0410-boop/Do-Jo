import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Update user's termsAccepted status
    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        termsAccepted: true,
        termsAcceptedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Terms accepted successfully",
    });
  } catch (error) {
    console.error("Error accepting terms:", error);
    return NextResponse.json(
      { error: "Failed to accept terms" },
      { status: 500 }
    );
  }
}
