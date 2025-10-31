import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import jsPDF from "jspdf";

/**
 * GET /api/feedback/[interviewId]/pdf
 * Generate PDF report of interview feedback
 *
 * TODO: Enhance PDF generation
 * 1. Add Japanese font support for better text rendering
 * 2. Add company logo and branding
 * 3. Include charts/graphs for scores
 * 4. Add page numbers and headers/footers
 * 5. Consider using react-pdf for more complex layouts
 * 6. Add watermark or security features
 * 7. Optimize file size
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { interviewId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const interviewId = params.interviewId;

    // Fetch interview with all related data
    const interview = await db.interview.findUnique({
      where: { id: interviewId },
      include: {
        candidate: true,
        interviewer: true,
        evaluation: {
          include: {
            interviewer: true,
          },
        },
        fluencyAnalysis: true,
      },
    });

    if (!interview) {
      return NextResponse.json(
        { error: "面接が見つかりません" },
        { status: 404 }
      );
    }

    // Check if user has access
    if (
      interview.candidateId !== session.user.id &&
      interview.interviewerId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "アクセス権限がありません" },
        { status: 403 }
      );
    }

    if (!interview.evaluation) {
      return NextResponse.json(
        { error: "評価がまだ提出されていません" },
        { status: 404 }
      );
    }

    // Generate PDF
    // NOTE: jsPDF has limited Japanese font support by default
    // For production, consider using a library with better i18n support
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.text("Do Jo - Interview Feedback Report", 20, 20);

    // Candidate Info
    doc.setFontSize(12);
    doc.text(`Candidate: ${interview.candidate.name}`, 20, 35);
    doc.text(`Email: ${interview.candidate.email}`, 20, 42);
    doc.text(
      `Japanese Level: ${interview.candidate.japaneseLevel || "N/A"}`,
      20,
      49
    );
    doc.text(
      `Interview Date: ${new Date(interview.scheduledAt).toLocaleDateString()}`,
      20,
      56
    );
    doc.text(`Interviewer: ${interview.interviewer.name}`, 20, 63);

    // Scores Section
    let yPos = 80;
    doc.setFontSize(16);
    doc.text("Evaluation Scores", 20, yPos);

    yPos += 10;
    doc.setFontSize(11);

    const scores = interview.evaluation.scores as any;
    const categories = [
      { key: "japanese", label: "Japanese Language Ability" },
      { key: "communication", label: "Communication Skills" },
      { key: "manner", label: "Interview Manner" },
      { key: "answers", label: "Quality of Answers" },
      { key: "overall", label: "Overall Impression" },
    ];

    categories.forEach((cat) => {
      const catScore = scores[cat.key];
      if (catScore) {
        doc.text(
          `${cat.label}: ${catScore.total}/20`,
          20,
          yPos
        );
        yPos += 7;
      }
    });

    // Calculate total
    const totalScore = categories.reduce((sum, cat) => {
      return sum + (scores[cat.key]?.total || 0);
    }, 0);
    doc.setFontSize(12);
    doc.text(`Total Score: ${totalScore}/100`, 20, yPos + 5);

    // Fluency Analysis
    if (interview.fluencyAnalysis) {
      yPos += 20;
      doc.setFontSize(16);
      doc.text("Fluency Analysis (AI)", 20, yPos);

      yPos += 10;
      doc.setFontSize(11);
      doc.text(
        `Speech Rate: ${interview.fluencyAnalysis.speechRate.toFixed(1)} words/sec`,
        20,
        yPos
      );
      yPos += 7;
      doc.text(
        `Pause Frequency: ${interview.fluencyAnalysis.pauseFrequency} per minute`,
        20,
        yPos
      );
      yPos += 7;
      doc.text(
        `Filler Words: ${interview.fluencyAnalysis.fillerCount}`,
        20,
        yPos
      );
      yPos += 7;
      doc.text(
        `Overall Fluency Score: ${interview.fluencyAnalysis.overallScore}/100`,
        20,
        yPos
      );
    }

    // Add new page for comments
    doc.addPage();
    yPos = 20;

    // Comments
    doc.setFontSize(16);
    doc.text("Interviewer Comments", 20, yPos);

    yPos += 10;
    doc.setFontSize(10);

    // Split text to fit in page width
    const splitComments = doc.splitTextToSize(
      interview.evaluation.comments,
      170
    );
    doc.text(splitComments, 20, yPos);

    // Advice (new page if needed)
    if (yPos + splitComments.length * 5 > 250) {
      doc.addPage();
      yPos = 20;
    } else {
      yPos += splitComments.length * 5 + 15;
    }

    doc.setFontSize(16);
    doc.text("Advice for Improvement", 20, yPos);

    yPos += 10;
    doc.setFontSize(10);
    const splitAdvice = doc.splitTextToSize(interview.evaluation.advice, 170);
    doc.text(splitAdvice, 20, yPos);

    // Encouragement Message (new page if needed)
    if (yPos + splitAdvice.length * 5 > 250) {
      doc.addPage();
      yPos = 20;
    } else {
      yPos += splitAdvice.length * 5 + 15;
    }

    doc.setFontSize(16);
    doc.text("Encouragement Message", 20, yPos);

    yPos += 10;
    doc.setFontSize(10);
    const splitEncouragement = doc.splitTextToSize(
      interview.evaluation.encouragementMessage,
      170
    );
    doc.text(splitEncouragement, 20, yPos);

    // Footer
    doc.setFontSize(8);
    doc.text(
      `Generated by Do Jo on ${new Date().toLocaleDateString()}`,
      20,
      280
    );

    // Generate PDF as buffer
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="interview-feedback-${interviewId}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "PDFの生成に失敗しました" },
      { status: 500 }
    );
  }
}
