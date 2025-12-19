import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE cancel a reservation
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

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: { slot: true },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    // Check if user owns this reservation
    const isLearner = reservation.learnerId === session.user.id;
    const isHost = reservation.hostId === session.user.id;

    if (!isLearner && !isHost) {
      return NextResponse.json(
        { error: "Not authorized to cancel this reservation" },
        { status: 403 }
      );
    }

    // Check if reservation can be cancelled (not already completed or cancelled)
    if (reservation.status === "completed" || reservation.status === "cancelled") {
      return NextResponse.json(
        { error: "Cannot cancel this reservation" },
        { status: 400 }
      );
    }

    // Cancel reservation and restore slot availability
    await prisma.$transaction(async (tx) => {
      await tx.reservation.update({
        where: { id },
        data: { status: "cancelled" },
      });

      await tx.slot.update({
        where: { id: reservation.slotId },
        data: { status: "available" },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error cancelling reservation:", error);
    return NextResponse.json(
      { error: "Failed to cancel reservation" },
      { status: 500 }
    );
  }
}

// GET single reservation
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        slot: true,
        learner: {
          select: {
            id: true,
            name: true,
            avatar: true,
            bio: true,
            country: true,
            nativeLanguage: true,
            jlptLevel: true,
            learningGoal: true,
            interests: true,
          },
        },
        host: {
          select: {
            id: true,
            name: true,
            avatar: true,
            bio: true,
            role: true,
            languages: true,
            interests: true,
            averageRating: true,
            careerHistory: true,
            expertise: true,
            university: true,
            major: true,
          },
        },
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    // Check if user is part of this reservation
    const isLearner = reservation.learnerId === session.user.id;
    const isHost = reservation.hostId === session.user.id;

    if (!isLearner && !isHost && session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Not authorized to view this reservation" },
        { status: 403 }
      );
    }

    return NextResponse.json(reservation);
  } catch (error) {
    console.error("Error fetching reservation:", error);
    return NextResponse.json(
      { error: "Failed to fetch reservation" },
      { status: 500 }
    );
  }
}
