import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getCurrentUser } from "@/lib/supabase/auth-server";
import AuthModal from "@/components/AuthModal";

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
        <header className="border-b border-line">
          <div className="container-wide flex h-14 items-center justify-between">
            <Link href="/" className="text-sm font-semibold tracking-tight">
              Team&nbsp;Retro
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              {user ? (
                <>
                  <Link href="/dashboard" className="text-muted hover:text-ink">
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
