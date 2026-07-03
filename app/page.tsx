import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase/auth-server";
import AuthModal from "@/components/AuthModal";
import Icon from "@/components/Icon";

export const dynamic = "force-dynamic";

const FEATURES = [
  { icon: "shield" as const, label: "即時建設性把關" },
  { icon: "message" as const, label: "選字逐句討論" },
  { icon: "sparkles" as const, label: "AI 團隊洞察" },
];

export default async function LandingPage() {
  const user = await getCurrentUser();

  return (
    <div
      className="relative -my-10 flex min-h-[calc(100vh-60px)] flex-col items-center justify-center overflow-hidden px-4 text-center"
      style={{
        backgroundImage:
          "radial-gradient(var(--border-strong) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
      }}
    >
      <div className="mx-auto max-w-3xl py-10">
        <p className="eyebrow" style={{ color: "var(--gold-700)" }}>
          給小團隊的回顧工具
        </p>

        <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
          誠實的團隊回饋，
          <br />
          少一點<span style={{ color: "var(--accent-press)" }}>尷尬</span>。
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
          發起一場 retro、分享連結，讓大家一起說真話。即時把關讓回饋保持建設性
          —— 結束後一起討論，再讓 AI 幫你看見重點。
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {user ? (
            <>
              <Link className="btn-primary" href="/dashboard">
                <Icon name="arrow-right" size={16} />
                前往我的 Dashboard
              </Link>
              <Link className="btn-ghost" href="/dashboard/new">
                <Icon name="plus" size={15} />
                發起新 retro
              </Link>
            </>
          ) : (
            <>
              <AuthModal
                label="免費開始使用"
                variant="primary"
                defaultTab="register"
              />
              <AuthModal label="登入" variant="ghost" defaultTab="login" />
            </>
          )}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
          {FEATURES.map((f) => (
            <span
              key={f.label}
              className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold"
              style={{ background: "var(--surface-2)", color: "var(--text)" }}
            >
              <span style={{ color: "var(--gold-700)" }}>
                <Icon name={f.icon} size={15} />
              </span>
              {f.label}
            </span>
          ))}
        </div>

        <p className="mt-8 text-xs text-subtle">
          只有發起者需要登入；填寫與討論的人用連結進來即可。
        </p>
      </div>
    </div>
  );
}
