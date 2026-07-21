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

---

## 媽媽的行事曆(`/calendar`)

同一個專案裡的獨立小 PWA:**用一句中文(說的或打的)就能新增行事曆事件**,
不接 Google/Apple 日曆、不用 AI —— 日期時間靠 `lib/calendar/parse.ts` 的
純規則解析(「下週三下午三點帶妹妹回診」→ 日期 + 時間 + 標題),資料存
Supabase,提醒用 Web Push 推播。

### 功能

- ➕ 新增:語音(瀏覽器 SpeechRecognition,沒有就退回 iOS 鍵盤麥克風)或
  打字 → 即時解析 → 確認卡(日期/時間/事情皆可手動修)→ 選提醒時間 → 儲存。
- 📅 月曆檢視:點日期看當天安排。
- 📋 清單檢視:依日期分組逐條列出,可展開過去的安排。
- 🔔 提醒:`/api/calendar/cron` 被排程打到時,把到期提醒推播給所有訂閱過的
  手機(iPhone 需 iOS 16.4+ 且**先加入主畫面**,app 內建引導)。
- 🔒 選填 `CALENDAR_PIN`:設定後要輸入通行碼才能使用(擋路人)。

### 設定步驟

1. 跑 migration `supabase/migrations/0010_calendar.sql`(`supabase db push`
   或貼進 SQL editor)。
2. 產生 VAPID 金鑰:`npx web-push generate-vapid-keys`,填進
   `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT`,
   並自訂一組 `CRON_SECRET`。
3. 部署後設定排程,每 5 分鐘打一次(Vercel Hobby 的 cron 一天只能一次,
   建議用免費的 [cron-job.org](https://cron-job.org)):

   ```
   GET https://你的網域/api/calendar/cron?key=<CRON_SECRET>
   ```

4. 手機用 Safari 開 `https://你的網域/calendar` → 分享 → 加入主畫面 →
   從主畫面開啟 → 按「🔔 開啟提醒」。

### 相關檔案

```
app/(calendar)/                calendar 專區獨立 root layout + 頁面
app/api/calendar/              events CRUD / push 訂閱 / cron 發送
components/calendar/           CalendarApp / AddEvent / MonthView / ListView
lib/calendar/parse.ts          中文口語日期時間解析器(純規則)
public/sw.js                   service worker(收推播、點通知開 app)
public/calendar.webmanifest    PWA manifest
supabase/migrations/0010_calendar.sql
```
