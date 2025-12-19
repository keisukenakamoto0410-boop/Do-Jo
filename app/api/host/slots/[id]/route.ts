import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE a slot
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const slot = await prisma.slot.findUnique({
      where: { id },
      include: { reservation: true },
    });

    if (!slot) {
      return NextResponse.json({ error: "Slot not found" }, { status: 404 });
    }

    // Check if user owns this slot
    if (slot.hostId !== session.user.id) {
      return NextResponse.json(
        { error: "Not authorized to delete this slot" },
        { status: 403 }
      );
    }

    // Cannot delete if slot has a reservation
    if (slot.reservation) {
      return NextResponse.json(
        { error: "Cannot delete a slot with an existing reservation" },
        { status: 400 }
      );
    }

    await prisma.slot.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting slot:", error);
    return NextResponse.json(
      { error: "Failed to delete slot" },
      { status: 500 }
    );
  }
}
