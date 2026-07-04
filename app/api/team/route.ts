import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth-server";
import { getLocale } from "@/lib/i18n/server";

export const runtime = "nodejs";

interface TeamBody {
  name?: string;
  team_size?: number | null;
}

// Owner-only: create/update the organizer's team profile.
export async function POST(req: Request) {
  const en = (await getLocale()) === "en";
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json(
      { error: en ? "Please log in first" : "請先登入" },
      { status: 401 },
    );

  let body: TeamBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  if (!name) {
    return NextResponse.json(
      { error: en ? "Team name is required." : "請輸入團隊名稱。" },
      { status: 400 },
    );
  }

  let teamSize: number | null = null;
  if (typeof body.team_size === "number" && Number.isFinite(body.team_size)) {
    teamSize = Math.max(1, Math.min(500, Math.round(body.team_size)));
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("retro_teams").upsert({
    owner_id: user.id,
    name: name.slice(0, 120),
    team_size: teamSize,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    return NextResponse.json(
      { error: en ? "Couldn't save" : "儲存失敗" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, name, team_size: teamSize });
}
