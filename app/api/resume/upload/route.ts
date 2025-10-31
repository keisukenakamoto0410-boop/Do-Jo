import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  uploadFile,
  isValidFileType,
  isValidFileSize,
  formatFileSize,
} from "@/lib/storage";

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // Check if user is a candidate
    if (session.user.userType !== "CANDIDATE") {
      return NextResponse.json(
        { error: "候補者のみが履歴書をアップロードできます" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "ファイルが選択されていません" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!isValidFileType(file.name)) {
      return NextResponse.json(
        { error: "PDF、DOCXファイルのみアップロード可能です" },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    if (!isValidFileSize(file.size, 5)) {
      return NextResponse.json(
        {
          error: `ファイルサイズが大きすぎます（最大5MB、現在: ${formatFileSize(
            file.size
          )}）`,
        },
        { status: 400 }
      );
    }

    // Upload file
    const { filename, url } = await uploadFile(file, session.user.id);

    // Mark all previous resumes as not latest
    await db.resume.updateMany({
      where: {
        userId: session.user.id,
        isLatest: true,
      },
      data: {
        isLatest: false,
      },
    });

    // Create database record
    const resume = await db.resume.create({
      data: {
        userId: session.user.id,
        fileName: file.name,
        fileUrl: url,
        isLatest: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "履歴書が正常にアップロードされました",
        resume: {
          id: resume.id,
          fileName: resume.fileName,
          fileUrl: resume.fileUrl,
          uploadedAt: resume.uploadedAt,
          isLatest: resume.isLatest,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Resume upload error:", error);
    return NextResponse.json(
      { error: "アップロードに失敗しました。もう一度お試しください。" },
      { status: 500 }
    );
  }
}
