import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteFile, extractFilenameFromUrl } from "@/lib/storage";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // Check if user is a candidate
    if (session.user.userType !== "CANDIDATE") {
      return NextResponse.json(
        { error: "候補者のみが履歴書を削除できます" },
        { status: 403 }
      );
    }

    const resumeId = params.id;

    // Find the resume
    const resume = await db.resume.findUnique({
      where: { id: resumeId },
    });

    if (!resume) {
      return NextResponse.json(
        { error: "履歴書が見つかりません" },
        { status: 404 }
      );
    }

    // Check ownership
    if (resume.userId !== session.user.id) {
      return NextResponse.json(
        { error: "この履歴書を削除する権限がありません" },
        { status: 403 }
      );
    }

    // Delete file from storage
    const filename = extractFilenameFromUrl(resume.fileUrl);
    try {
      await deleteFile(filename);
    } catch (error) {
      console.error("Failed to delete file:", error);
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await db.resume.delete({
      where: { id: resumeId },
    });

    // If this was the latest resume, mark another as latest
    if (resume.isLatest) {
      const latestResume = await db.resume.findFirst({
        where: {
          userId: session.user.id,
        },
        orderBy: {
          uploadedAt: "desc",
        },
      });

      if (latestResume) {
        await db.resume.update({
          where: { id: latestResume.id },
          data: { isLatest: true },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "履歴書が正常に削除されました",
    });
  } catch (error) {
    console.error("Resume delete error:", error);
    return NextResponse.json(
      { error: "削除に失敗しました。もう一度お試しください。" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const resumeId = params.id;

    // Find the resume
    const resume = await db.resume.findUnique({
      where: { id: resumeId },
      select: {
        id: true,
        fileName: true,
        fileUrl: true,
        uploadedAt: true,
        isLatest: true,
        userId: true,
      },
    });

    if (!resume) {
      return NextResponse.json(
        { error: "履歴書が見つかりません" },
        { status: 404 }
      );
    }

    // Check ownership (candidates) or interviewer access
    if (
      resume.userId !== session.user.id &&
      session.user.userType !== "INTERVIEWER" &&
      session.user.userType !== "ADMIN"
    ) {
      return NextResponse.json(
        { error: "この履歴書を閲覧する権限がありません" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      resume,
    });
  } catch (error) {
    console.error("Resume get error:", error);
    return NextResponse.json(
      { error: "履歴書の取得に失敗しました" },
      { status: 500 }
    );
  }
}
