# Team Retro

A small web tool for 2–5 person groups to give each other feedback (agile-retro
style). The starter picks a questionnaire and generates a share link; members
fill it in while the system gatekeeps for **constructive** feedback in real time;
once everyone is done the starter closes the session and the group reviews the
results together.

Built with **Next.js (App Router) + TypeScript + Tailwind**, **Supabase**
(Postgres + RLS + Realtime), and **Google Gemini** for moderation (and
coming-next AI summaries).

## Status

**Phase 1 (this build): the core flow.**

- Create a session (pick template, anonymity, deadline) → get a share link.
- Fill the form with **two-stage content gatekeeping**:
  1. a keyword blocklist (`lib/blocklist.ts`) instantly flags blatant personal
     insults, and
  2. an LLM pass (`POST /api/moderate`, Google Gemini) judges
     constructive / emotional and returns a friendly rewrite suggestion.
     Failures degrade to the keyword list and **let the user through** — the
     gate never blocks on our outage.
- Owner-only **close session** (per-session `owner_token` httpOnly cookie).
- Grouped, de-identified **results** page (author names hidden in anonymous
  mode).

**Phase 2 (this build): select-to-comment + AI summary.**

- **Select-to-comment** on the results page: highlight any span of an answer →
  a floating “💬 留言” button → comment on that quote. Threads render as
  highlights + a side panel, kept in sync across viewers via **Supabase
  Realtime** (`POST /api/comments`). Anonymous mode never stores/returns author
  names.
- **AI assistant** (`POST /api/summarize`, Google Gemini): summarizes the whole
  session (de-identified, text only) into themes / positives / improvements /
  concrete next steps as markdown, with multi-turn follow-up questions.

## Prerequisites

- Node.js 18.18+ (or 20+)
- A Supabase project
- A Google Gemini API key (optional)

## 1. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
```

| Variable                        | Where it's used                     | Exposed to browser? |
| ------------------------------- | ----------------------------------- | ------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | anon client + Realtime + server     | yes                 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon client + Realtime              | yes                 |
| `SUPABASE_SERVICE_ROLE_KEY`     | server routes (privileged writes)   | **no**              |
| `GEMINI_API_KEY` (optional)     | `/api/moderate`                     | **no**              |

> The service-role and Gemini keys are server-only and never bundled into the
> client. `sessions.owner_token` is likewise never exposed — the browser client
> is never granted access to the `sessions` table.

## 2. Database

Run the migration against your Supabase project. Either paste
`supabase/migrations/0001_init.sql` into the Supabase SQL editor, or with the
Supabase CLI:

```bash
supabase db push
```

This creates the `retro_sessions`, `retro_participants`, `retro_answers`,
`retro_comments` tables (prefixed so it can share a Supabase project with other
apps), the RLS policies, and enables Realtime on `retro_comments`.

## 3. Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000, create a session, and open the share link
(`/s/<session_id>`) in another browser/incognito to fill it in.

## 4. Deploy (Vercel)

Import the repo into Vercel, set the four environment variables in the project
settings, and deploy. No extra config needed.

## Project layout

```
app/
  page.tsx                     create-session form
  s/[session_id]/page.tsx      fill-in form (+ deadline countdown, moderation)
  s/[session_id]/results/page.tsx   grouped results + owner close
  api/
    sessions/route.ts          create session (sets owner cookie)
    sessions/[id]/close/route.ts  close (owner-token gated)
    answers/route.ts           submit answers (open + not expired)
    moderate/route.ts          single-answer gatekeeping (Google Gemini)
lib/
  supabase/{server,client}.ts  service-role + anon clients
  templates.ts                 3 built-in questionnaires
  blocklist.ts                 中英 insult keyword list
  owner.ts                     owner-token cookie helpers
  types.ts
components/                    form + results UI
supabase/migrations/0001_init.sql
```
