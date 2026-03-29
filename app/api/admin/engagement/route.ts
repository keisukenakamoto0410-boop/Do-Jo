import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

const ADMIN_EMAILS = ["keisuke.mjugaad91@gmail.com", "admin@dojo.com"];

export async function GET(req: NextRequest) {
  try {
    console.log("[Engagement API] Starting request");

    // 認証チェック
    let session;
    try {
      session = await getServerSession(authOptions);
      console.log("[Engagement API] Session:", session?.user?.email);
    } catch (authError) {
      console.error("[Engagement API] Auth error:", authError);
      return NextResponse.json(
        { error: "Authentication failed", details: authError instanceof Error ? authError.message : "Unknown auth error" },
        { status: 500 }
      );
    }

    if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
      console.log("[Engagement API] Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // エンゲージメントログを取得
    let supabase;
    try {
      console.log("[Engagement API] Initializing Supabase admin client");
      supabase = getSupabaseAdmin();
    } catch (supabaseError) {
      console.error("[Engagement API] Supabase init error:", supabaseError);
      return NextResponse.json(
        { error: "Supabase initialization failed", details: supabaseError instanceof Error ? supabaseError.message : "Unknown error" },
        { status: 500 }
      );
    }

    console.log("[Engagement API] Fetching engagement logs");
    const { data, error } = await supabase
      .from("engagement_logs")
      .select("*")
      .order("recorded_at", { ascending: false });

    if (error) {
      console.error("[Engagement API] Supabase query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch engagement logs", details: error.message },
        { status: 500 }
      );
    }

    console.log(`[Engagement API] Found ${data?.length || 0} logs`);

    // スネークケースをキャメルケースに変換
    const logs = (data || []).map((log: any) => ({
      id: log.id,
      sessionId: log.session_id,
      foreignerSpeakSec: log.foreigner_speak_sec,
      seniorSpeakSec: log.senior_speak_sec,
      silenceSec: log.silence_sec,
      seniorEnergyRating: log.senior_energy_rating,
      recordedAt: log.recorded_at,
    }));

    console.log("[Engagement API] Request successful");
    return NextResponse.json({ logs });
  } catch (error) {
    console.error("[Engagement API] Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("[Engagement API] Stack trace:", errorStack);
    return NextResponse.json(
      { error: "Internal server error", details: errorMessage, stack: errorStack },
      { status: 500 }
    );
  }
}
