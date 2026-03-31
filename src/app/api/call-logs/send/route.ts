import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { startOfDay, endOfDay, format } from "date-fns";

export async function POST(request: Request) {
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

    const { date } = await request.json();
    const targetDate = new Date(date);
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

    if (!callLogs || callLogs.length === 0) {
      return NextResponse.json(
        { error: "No call logs for this date" },
        { status: 400 }
      );
    }

    // Build HTML email
    const dateStr = format(targetDate, "dd MMM yyyy");
    const sorted = callLogs.filter((l) => l.is_sorted).length;
    const html = `
      <h2>Call Log — ${dateStr}</h2>
      <p>${callLogs.length} calls | ${sorted} sorted | ${callLogs.length - sorted} unsorted</p>
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif;font-size:13px;">
        <tr style="background:#f0f0f0;">
          <th>Number</th>
          <th>Name</th>
          <th>Question</th>
          <th>Answer</th>
          <th>Sorted</th>
        </tr>
        ${callLogs
          .map(
            (log) => `
          <tr>
            <td>${log.phone_number}</td>
            <td>${log.caller_name || "—"}</td>
            <td>${log.question || "—"}</td>
            <td>${log.answer || "—"}</td>
            <td style="text-align:center;">${log.is_sorted ? "✓" : "—"}</td>
          </tr>
        `
          )
          .join("")}
      </table>
    `;

    // Send via Resend if configured
    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);

      // Get org admin's email for the "to" field
      const { data: adminProfile } = await supabase
        .from("profiles")
        .select("email")
        .eq("organization_id", profile.organization_id)
        .eq("role", "admin")
        .single();

      const toEmail = adminProfile?.email || user.email!;

      await resend.emails.send({
        from: "CallDesk <noreply@calldesk.app>",
        to: toEmail,
        subject: `Call Log — ${dateStr}`,
        html,
      });

      return NextResponse.json({ success: true });
    }

    // If no Resend key, return the HTML for preview
    return NextResponse.json({ success: true, html });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
