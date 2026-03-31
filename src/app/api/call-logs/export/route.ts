import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { startOfDay, endOfDay, format } from "date-fns";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "No profile found" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");

    if (!dateParam) {
      return NextResponse.json(
        { error: "Date parameter required" },
        { status: 400 }
      );
    }

    const targetDate = new Date(dateParam);
    const dayStart = startOfDay(targetDate).toISOString();
    const dayEnd = endOfDay(targetDate).toISOString();

    const { data: callLogs, error } = await supabase
      .from("call_logs")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .gte("call_date", dayStart)
      .lt("call_date", dayEnd)
      .order("call_date", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Generate CSV
    const headers = ["Number", "Name", "Question", "Answer", "Sorted", "Direction", "Date"];
    const rows = (callLogs || []).map((log) => [
      log.phone_number,
      log.caller_name || "",
      (log.question || "").replace(/"/g, '""'),
      (log.answer || "").replace(/"/g, '""'),
      log.is_sorted ? "Yes" : "No",
      log.call_direction,
      format(new Date(log.call_date), "dd/MM/yyyy HH:mm"),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((r) => r.map((c) => `"${c}"`).join(",")),
    ].join("\n");

    const dateStr = format(targetDate, "yyyy-MM-dd");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="call-log-${dateStr}.csv"`,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
