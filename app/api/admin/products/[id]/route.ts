import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Admin emails that can access this endpoint
const ADMIN_EMAILS = ["keisuke.mjugaad91@gmail.com"];

// PATCH: Update a product mapping
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { keyword, amazonUrl, productName, category, isActive } = body;

    // Check if product exists
    const existing = await prisma.productMapping.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Product mapping not found" },
        { status: 404 }
      );
    }

    // If keyword is being changed, check for duplicates
    if (keyword && keyword.toLowerCase().trim() !== existing.keyword) {
      const duplicate = await prisma.productMapping.findUnique({
        where: { keyword: keyword.toLowerCase().trim() },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: "This keyword already exists" },
          { status: 400 }
        );
      }
    }

    const product = await prisma.productMapping.update({
      where: { id },
      data: {
        ...(keyword && { keyword: keyword.toLowerCase().trim() }),
        ...(amazonUrl && { amazonUrl }),
        ...(productName && { productName }),
        ...(category && { category }),
        ...(typeof isActive === "boolean" && { isActive }),
      },
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Failed to update product mapping:", error);
    return NextResponse.json(
      { error: "Failed to update product mapping" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a product mapping
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id } = await params;

    // Check if product exists
    const existing = await prisma.productMapping.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Product mapping not found" },
        { status: 404 }
      );
    }

    await prisma.productMapping.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete product mapping:", error);
    return NextResponse.json(
      { error: "Failed to delete product mapping" },
      { status: 500 }
    );
  }
}
