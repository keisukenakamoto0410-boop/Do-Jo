import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadVideo } from "@/lib/upload-helpers";
import { analyzeFluency } from "@/lib/analysis/fluency-analyzer";

export async function POST(
  request: Request,
  { params }: { params: { interviewId: string } }
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
        { error: "候補者のみがアクセスできます" },
        { status: 403 }
      );
    }

    const { interviewId } = params;

    // Find the interview
    const interview = await db.interview.findUnique({
      where: { id: interviewId },
      include: {
        candidate: true,
        interviewer: true,
        slot: true,
      },
    });

    if (!interview) {
      return NextResponse.json(
        { error: "面接が見つかりません" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (interview.candidateId !== session.user.id) {
      return NextResponse.json(
        { error: "この面接にアクセスする権限がありません" },
        { status: 403 }
      );
    }

    // Check if interview is scheduled
    if (interview.status !== "SCHEDULED") {
      return NextResponse.json(
        { error: "承認済みの面接のみ動画をアップロードできます" },
        { status: 400 }
      );
    }

    // Check if video already uploaded
    if (interview.videoUrl) {
      return NextResponse.json(
        { error: "この面接には既に動画がアップロードされています" },
        { status: 400 }
      );
    }

    // Get file from form data
    const formData = await request.formData();
    const file = formData.get("video") as File;

    if (!file) {
      return NextResponse.json(
        { error: "動画ファイルが必要です" },
        { status: 400 }
      );
    }

    // Upload video
    const { url, filename, size } = await uploadVideo(file, interviewId);

    // Update interview record
    const updatedInterview = await db.interview.update({
      where: { id: interviewId },
      data: {
        videoUrl: url,
        status: "COMPLETED",
        conductedAt: new Date(),
      },
    });

    // Trigger fluency analysis (async - don't wait for completion)
    console.log(
      `📹 Video uploaded for interview ${interviewId}. Starting fluency analysis...`
    );

    // Run analysis in background (don't block response)
    analyzeFluency(url, interviewId)
      .then(async (analysisResult) => {
        // Save analysis results
        await db.fluencyAnalysis.create({
          data: {
            interviewId: interviewId,
            speechRate: analysisResult.speechRate,
            pauseFrequency: analysisResult.pauseFrequency,
            fillerCount: analysisResult.fillerCount,
            totalDuration: analysisResult.totalDuration,
            overallScore: Math.round(analysisResult.overallScore * 20), // Convert 1-5 to 0-100
          },
        });
        console.log(`✅ Fluency analysis completed for interview ${interviewId}`);
      })
      .catch((error) => {
        console.error(`❌ Fluency analysis failed for interview ${interviewId}:`, error);
      });

    // Send notification to interviewer (mock)
    console.log("📧 [Mock Email] Video Upload Notification");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`To: ${interview.interviewer.email}`);
    console.log(`Subject: 面接動画がアップロードされました`);
    console.log("\nBody:");
    console.log(`${interview.interviewer.name}様`);
    console.log("\n面接動画がアップロードされました。");
    console.log("\n【面接情報】");
    console.log(`候補者: ${interview.candidate.name}`);
    console.log(
      `日時: ${new Date(interview.scheduledAt).toLocaleDateString("ja-JP")}`
    );
    console.log(`カテゴリー: ${interview.slot.jobCategory}`);
    console.log(`\n動画URL: ${url}`);
    console.log(`ファイルサイズ: ${(size / 1024 / 1024).toFixed(2)} MB`);
    console.log("\n評価をお願いいたします。");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    return NextResponse.json({
      success: true,
      message: "動画のアップロードが完了しました",
      interview: {
        id: updatedInterview.id,
        status: updatedInterview.status,
        videoUrl: url,
        conductedAt: updatedInterview.conductedAt,
      },
      video: {
        url,
        filename,
        size,
      },
    });
  } catch (error) {
    console.error("Video upload error:", error);

    // Handle specific error messages
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "動画のアップロードに失敗しました" },
      { status: 500 }
    );
  }
}
