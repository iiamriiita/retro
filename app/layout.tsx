import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getCurrentUser } from "@/lib/supabase/auth-server";
import AuthModal from "@/components/AuthModal";
import Icon from "@/components/Icon";

export const metadata: Metadata = {
  title: "Team Retro",
  description: "小組互評回顧工具 — 即時把關有建設性的回饋。",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <html lang="zh-Hant">
      <body>
        <header
          className="sticky top-0 z-10 border-b border-line"
          style={{ background: "var(--surface)" }}
        >
          <div className="container-wide flex h-[60px] items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2.5 font-display text-[17px] font-extrabold tracking-tight"
            >
              <span
                className="flex h-[26px] w-[26px] items-center justify-center rounded-md"
                style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
              >
                <Icon name="database" size={16} />
              </span>
              Team&nbsp;Retro
            </Link>
            <nav className="flex items-center gap-5 text-sm">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="font-semibold text-muted hover:text-ink"
                  >
                    Dashboard
                  </Link>
                  <form action="/auth/signout" method="post">
                    <button className="text-muted hover:text-ink">登出</button>
                  </form>
                </>
              ) : (
                <AuthModal label="登入" variant="nav" defaultTab="login" />
              )}
            </nav>
          </div>
        </header>
        <main className="py-10">{children}</main>
      </body>
    </html>
  );
}
