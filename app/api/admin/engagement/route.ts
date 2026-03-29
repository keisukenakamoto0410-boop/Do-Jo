import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

const ADMIN_EMAILS = ["keisuke.mjugaad91@gmail.com", "admin@dojo.com"];

export async function GET(req: NextRequest) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // エンゲージメントログを取得
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("engagement_logs")
      .select("*")
      .order("recorded_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch engagement logs", details: error.message },
        { status: 500 }
      );
    }

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

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Error in engagement API:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 }
    );
  }
}
