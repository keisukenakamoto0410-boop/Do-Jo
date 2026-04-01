// app/api/cron/weekly-reminder/route.ts
// 毎週水曜日 9:00 JSTにシニア全員にLINEメッセージを送信

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pushMessage } from "@/lib/line/messaging";

// 動的レンダリングを強制
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/cron/weekly-reminder
 *
 * 毎週水曜日 9:00 JST に実行
 * シニア全員にGoogleフォームのリンクを送信
 *
 * セキュリティ：
 * - CRON_SECRET環境変数で認証
 * - Vercel Cron Jobsからのみアクセス可能
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now();

  try {
    // セキュリティチェック: CRON_SECRETで認証
    const authHeader = req.headers.get("authorization");
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    console.log("[CRON] Auth check:", {
      hasAuthHeader: !!authHeader,
      hasSecret: !!process.env.CRON_SECRET,
      match: authHeader === expectedAuth
    });

    if (!authHeader || authHeader !== expectedAuth) {
      console.error("[CRON] Unauthorized access attempt");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("[CRON] Weekly reminder job started");

    // 1. Supabaseからrole="senior"のユーザーを全件取得
    const seniors = await prisma.user.findMany({
      where: {
        role: "senior",
        lineId: {
          not: null, // LINE IDが設定されているユーザーのみ
        },
      },
      select: {
        id: true,
        name: true,
        lineId: true,
      },
    });

    console.log(`[CRON] Found ${seniors.length} seniors with LINE ID`);

    if (seniors.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No seniors found with LINE ID",
        sent: 0,
        failed: 0,
        duration: Date.now() - startTime,
      });
    }

    // 2. 送信するメッセージ
    const message = {
      type: "text",
      text: `来週の予定を教えてください📅
以下のフォームから入力をお願いします。

https://forms.gle/wgGKF32EoiKgp3CS9`,
    };

    // 3. 全員に送信（並列処理）
    const results = await Promise.allSettled(
      seniors.map(async (senior) => {
        try {
          await pushMessage(senior.lineId!, message);
          console.log(`[CRON] ✓ Sent to ${senior.name} (${senior.lineId})`);
          return { success: true, senior };
        } catch (error) {
          console.error(`[CRON] ✗ Failed to send to ${senior.name}:`, error);
          return { success: false, senior, error };
        }
      })
    );

    // 4. 結果を集計
    const successful = results.filter(
      (r) => r.status === "fulfilled" && r.value.success
    ).length;
    const failed = results.length - successful;

    const duration = Date.now() - startTime;

    console.log(`[CRON] Weekly reminder completed: ${successful}/${seniors.length} sent (${failed} failed) in ${duration}ms`);

    // 5. 詳細な結果を返す
    return NextResponse.json({
      success: true,
      message: "Weekly reminder sent",
      stats: {
        total: seniors.length,
        sent: successful,
        failed: failed,
        duration: duration,
      },
      results: results.map((r, index) => {
        if (r.status === "fulfilled") {
          return {
            senior: seniors[index].name,
            lineId: seniors[index].lineId,
            success: r.value.success,
          };
        } else {
          return {
            senior: seniors[index].name,
            lineId: seniors[index].lineId,
            success: false,
            error: r.reason?.message || "Unknown error",
          };
        }
      }),
    });
  } catch (error) {
    console.error("[CRON] Weekly reminder job failed:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
        duration: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
