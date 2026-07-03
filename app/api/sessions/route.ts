import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth-server";
import { getTemplate } from "@/lib/templates";
import { getLocale } from "@/lib/i18n/server";
import type { Anonymity } from "@/lib/types";

export const runtime = "nodejs";

interface CreateBody {
  template_id?: string;
  anonymity?: Anonymity;
  deadline?: string; // ISO datetime
  group_size?: number;
  allow_adhoc?: boolean;
  participants?: string[]; // named-mode roster
}

export async function POST(req: Request) {
  // Only a logged-in organizer can create a session.
  const en = (await getLocale()) === "en";
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: en ? "Please log in first" : "請先登入" },
      { status: 401 },
    );
  }

  let body: CreateBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const template = body.template_id ? getTemplate(body.template_id) : undefined;
  if (!template) {
    return NextResponse.json({ error: "Unknown template" }, { status: 400 });
  }

  const anonymity: Anonymity =
    body.anonymity === "anonymous" ? "anonymous" : "named";

  const deadline = body.deadline ? new Date(body.deadline) : null;
  if (!deadline || Number.isNaN(deadline.getTime())) {
    return NextResponse.json({ error: "Invalid deadline" }, { status: 400 });
  }
  if (deadline.getTime() <= Date.now()) {
    return NextResponse.json(
      { error: en ? "The deadline must be in the future" : "截止時間必須在未來" },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("retro_sessions")
    .insert({
      owner_id: user.id,
      template_id: template.id,
      anonymity,
      deadline: deadline.toISOString(),
      status: "open",
      group_size: typeof body.group_size === "number" ? body.group_size : null,
      allow_adhoc: body.allow_adhoc !== false,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("create session failed:", error);
    return NextResponse.json(
      {
        error:
          (en ? "Failed to create: " : "建立失敗：") +
          (error?.message ?? "unknown error"),
      },
      { status: 500 },
    );
  }

  // Named mode: pre-create the roster from the provided names.
  const roster = (body.participants ?? [])
    .map((n) => n.trim())
    .filter((n) => n.length > 0);
  if (anonymity === "named" && roster.length > 0) {
    const { error: rErr } = await supabase.from("retro_participants").insert(
      roster.map((display_name) => ({
        session_id: data.id,
        display_name,
      })),
    );
    if (rErr) console.error("roster insert failed:", rErr);
  }

  return NextResponse.json({ id: data.id });
}
