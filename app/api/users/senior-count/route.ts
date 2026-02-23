import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const count = await prisma.user.count({
      where: { role: "senior" },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error fetching senior count:", error);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}
