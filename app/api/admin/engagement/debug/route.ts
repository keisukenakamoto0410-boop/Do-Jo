import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const debug: any = {
    step: "start",
    timestamp: new Date().toISOString(),
  };

  try {
    // Step 1: Check auth
    debug.step = "checking_auth";
    const session = await getServerSession(authOptions);
    debug.session_exists = !!session;
    debug.user_email = session?.user?.email || null;
    debug.user_role = session?.user?.role || null;

    // Step 2: Check environment variables
    debug.step = "checking_env";
    debug.env_checks = {
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      DATABASE_URL: !!process.env.DATABASE_URL,
    };

    // Step 3: Try to initialize Supabase
    debug.step = "initializing_supabase";
    try {
      const { getSupabaseAdmin } = await import("@/lib/supabase");
      const supabase = getSupabaseAdmin();
      debug.supabase_initialized = true;

      // Step 4: Try a simple query
      debug.step = "querying_database";
      const { data, error } = await supabase
        .from("engagement_logs")
        .select("count")
        .limit(1);

      debug.query_success = !error;
      debug.query_error = error ? error.message : null;
      debug.data_count = data?.length || 0;
    } catch (supabaseError) {
      debug.supabase_error = supabaseError instanceof Error ? supabaseError.message : String(supabaseError);
    }

    debug.step = "complete";
    return NextResponse.json(debug);
  } catch (error) {
    debug.step = "error";
    debug.error = error instanceof Error ? error.message : String(error);
    debug.error_stack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json(debug, { status: 500 });
  }
}
