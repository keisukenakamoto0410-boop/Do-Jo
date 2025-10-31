import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // Check if user is a candidate
    if (session.user.userType !== "CANDIDATE") {
      return NextResponse.json(
        { error: "候補者のみが履歴書を閲覧できます" },
        { status: 403 }
      );
    }

    // Fetch user's resumes, sorted by upload date (newest first)
    const resumes = await db.resume.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        uploadedAt: "desc",
      },
      select: {
        id: true,
        fileName: true,
        fileUrl: true,
        uploadedAt: true,
        isLatest: true,
      },
    });

    return NextResponse.json({
      success: true,
      resumes,
      count: resumes.length,
    });
  } catch (error) {
    console.error("Resume list error:", error);
    return NextResponse.json(
      { error: "履歴書の取得に失敗しました" },
      { status: 500 }
    );
  }
}
