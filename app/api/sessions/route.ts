import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getTemplate } from "@/lib/templates";
import { newOwnerToken, setOwnerCookie } from "@/lib/owner";
import type { Anonymity } from "@/lib/types";

export const runtime = "nodejs";

interface CreateBody {
  template_id?: string;
  anonymity?: Anonymity;
  deadline?: string; // ISO datetime
}

export async function POST(req: Request) {
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
      { error: "Deadline must be in the future" },
      { status: 400 },
    );
  }

  const ownerToken = newOwnerToken();
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("retro_sessions")
    .insert({
      owner_token: ownerToken,
      template_id: template.id,
      anonymity,
      deadline: deadline.toISOString(),
      status: "open",
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("create session failed:", error);
    return NextResponse.json(
      { error: `建立失敗：${error?.message ?? "unknown error"}` },
      { status: 500 },
    );
  }

  await setOwnerCookie(data.id, ownerToken);

  return NextResponse.json({ id: data.id });
}
