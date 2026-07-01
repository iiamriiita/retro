import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Team Retro",
  description: "小組互評回顧工具 — 即時把關有建設性的回饋。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant">
      <body>
        <header className="border-b border-line">
          <div className="container-wide flex h-14 items-center">
            <a href="/" className="text-sm font-semibold tracking-tight">
              Team&nbsp;Retro
            </a>
          </div>
        </header>
        <main className="py-10">{children}</main>
      </body>
    </html>
  );
}
