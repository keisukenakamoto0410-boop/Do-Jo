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
      console.error("Failed to fetch engagement logs:", error);
      return NextResponse.json(
        { error: "Failed to fetch engagement logs" },
        { status: 500 }
      );
    }

    return NextResponse.json({ logs: data || [] });
  } catch (error) {
    console.error("Error in engagement API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
