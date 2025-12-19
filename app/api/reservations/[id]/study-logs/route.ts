import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";

// POST - Upload a study log image
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: reservationId } = await params;

    // Verify reservation belongs to this learner
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    if (reservation.learnerId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const formData = await request.formData();
    const image = formData.get("image") as File;
    const slot = parseInt(formData.get("slot") as string);

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (slot < 1 || slot > 4) {
      return NextResponse.json({ error: "Invalid slot number" }, { status: 400 });
    }

    // Check if slot is already used
    const existingLog = await prisma.studyLog.findUnique({
      where: {
        reservationId_imageOrder: {
          reservationId,
          imageOrder: slot,
        },
      },
    });

    if (existingLog) {
      return NextResponse.json({ error: "Slot already used" }, { status: 409 });
    }

    // Upload to Vercel Blob
    let imageUrl: string;

    try {
      const blob = await put(
        `study-logs/${reservationId}-${slot}-${Date.now()}.jpg`,
        image,
        { access: "public" }
      );
      imageUrl = blob.url;
    } catch (blobError) {
      console.error("Blob upload error:", blobError);
      // Fallback: Use base64 data URL for development
      const bytes = await image.arrayBuffer();
      const base64 = Buffer.from(bytes).toString("base64");
      imageUrl = `data:${image.type};base64,${base64}`;
    }

    // Create study log
    const studyLog = await prisma.studyLog.create({
      data: {
        reservationId,
        learnerId: session.user.id,
        imageUrl,
        imageOrder: slot,
      },
    });

    // Update study log count
    await prisma.reservation.update({
      where: { id: reservationId },
      data: {
        studyLogCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json(studyLog, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}

// GET - Get all study logs for a reservation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: reservationId } = await params;

    // Verify user has access to this reservation
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    if (reservation.learnerId !== session.user.id && reservation.hostId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const studyLogs = await prisma.studyLog.findMany({
      where: { reservationId },
      orderBy: { imageOrder: "asc" },
    });

    return NextResponse.json(studyLogs);
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch study logs" },
      { status: 500 }
    );
  }
}
