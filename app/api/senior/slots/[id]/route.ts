// app/api/senior/slots/[id]/route.ts
// API endpoint for seniors to delete their own slots

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * DELETE /api/senior/slots/[id]
 *
 * Authenticated endpoint for seniors to delete their availability slots
 * Only allows deletion of slots that are not booked
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user can delete slots (senior or admin)
    if (session.user.role === "learner") {
      return NextResponse.json(
        { error: "Learners cannot delete slots" },
        { status: 403 }
      );
    }

    const slotId = params.id;

    console.log("[/api/senior/slots/[id]] DELETE request:", {
      userId: session.user.id,
      slotId,
    });

    // Find the slot
    const slot = await prisma.slot.findUnique({
      where: { id: slotId },
      include: {
        reservation: true,
      },
    });

    if (!slot) {
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });
    }

    // Check if slot belongs to the current user (admin can delete any slot)
    if (slot.hostId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json(
        { error: "You can only delete your own slots" },
        { status: 403 }
      );
    }

    // Check if slot is booked
    if (slot.reservation) {
      return NextResponse.json(
        { error: "Cannot delete a slot that has been booked" },
        { status: 400 }
      );
    }

    // Delete the slot
    await prisma.slot.delete({
      where: { id: slotId },
    });

    console.log("[/api/senior/slots/[id]] Slot deleted successfully:", slotId);

    return NextResponse.json({
      success: true,
      message: "Slot deleted successfully",
    });
  } catch (error) {
    console.error("[/api/senior/slots/[id]] Error:", error);

    return NextResponse.json(
      {
        error: "Failed to delete slot",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
