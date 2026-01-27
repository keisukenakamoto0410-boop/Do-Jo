import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Admin emails that can access this endpoint
const ADMIN_EMAILS = ["keisuke.mjugaad91@gmail.com"];

// GET: Get all product mappings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const isActive = searchParams.get("isActive");

    const where: Record<string, unknown> = {};
    if (category && category !== "all") {
      where.category = category;
    }
    if (isActive !== null && isActive !== "all") {
      where.isActive = isActive === "true";
    }

    const products = await prisma.productMapping.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Failed to fetch product mappings:", error);
    return NextResponse.json(
      { error: "Failed to fetch product mappings" },
      { status: 500 }
    );
  }
}

// POST: Create a new product mapping
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { keyword, amazonUrl, productName, category, isActive } = body;

    if (!keyword || !amazonUrl || !productName) {
      return NextResponse.json(
        { error: "keyword, amazonUrl, productName are required" },
        { status: 400 }
      );
    }

    // Check if keyword already exists
    const existing = await prisma.productMapping.findUnique({
      where: { keyword: keyword.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "This keyword already exists" },
        { status: 400 }
      );
    }

    const product = await prisma.productMapping.create({
      data: {
        keyword: keyword.toLowerCase().trim(),
        amazonUrl,
        productName,
        category: category || "food",
        isActive: isActive !== false,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("Failed to create product mapping:", error);
    return NextResponse.json(
      { error: "Failed to create product mapping" },
      { status: 500 }
    );
  }
}
