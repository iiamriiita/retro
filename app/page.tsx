import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase/auth-server";
import AuthModal from "@/components/AuthModal";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const user = await getCurrentUser();

  return (
    <div className="container-narrow">
      <section className="py-6">
        <h1 className="text-3xl font-semibold tracking-tight">
          給小組的回顧工具
        </h1>
        <p className="mt-3 text-base text-muted">
          2–5 人的小組互相給回饋。發起一場 retro、分享連結，成員填寫時系統會即時把關「有沒有建設性」；結束後大家一起看結果、逐句討論，還能讓 AI 助理歸納主題與具體調整方向。
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          {user ? (
            <Link className="btn-primary" href="/dashboard">
              前往我的 Dashboard
            </Link>
          ) : (
            <>
              <AuthModal
                label="免費註冊"
                variant="primary"
                defaultTab="register"
              />
              <AuthModal label="登入" variant="nav" defaultTab="login" />
            </>
          )}
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          {
            t: "即時把關",
            d: "關鍵字 + AI 雙重把關，擋掉人身攻擊與純情緒，保留有建設性的批評。",
          },
          {
            t: "選字討論",
            d: "結束後對任一段回答選字留言，像 Google Docs 一樣即時同步。",
          },
          {
            t: "AI 總結",
            d: "把整場回答歸納成主題、亮點、待改善與可行動的 next steps。",
          },
        ].map((f) => (
          <div key={f.t} className="card">
            <h3 className="text-sm font-semibold">{f.t}</h3>
            <p className="mt-1 text-xs text-muted">{f.d}</p>
          </div>
        ))}
      </section>

      <p className="mt-8 text-xs text-muted">
        只有發起者需要登入；填寫與參與討論的人用連結進來即可。
      </p>
    </div>
  );
}
