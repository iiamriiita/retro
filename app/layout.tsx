import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getCurrentUser } from "@/lib/supabase/auth-server";
import { getT } from "@/lib/i18n/server";
import { LocaleProvider } from "@/lib/i18n/client";
import AuthModal from "@/components/AuthModal";
import Icon from "@/components/Icon";
import LangSwitcher from "@/components/LangSwitcher";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("meta.title"), description: t("meta.description") };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const { locale, t } = await getT();

  return (
    <html lang={locale === "zh" ? "zh-Hant" : "en"}>
      <body>
        <LocaleProvider locale={locale}>
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
                  style={{
                    background: "var(--accent)",
                    color: "var(--text-inverse)",
                  }}
                >
                  <Icon name="database" size={16} />
                </span>
                Team&nbsp;Retro
              </Link>
              <nav className="flex items-center gap-4 text-sm">
                {user ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="font-semibold text-muted hover:text-ink"
                    >
                      {t("nav.dashboard")}
                    </Link>
                    <form action="/auth/signout" method="post">
                      <button className="text-muted hover:text-ink">
                        {t("nav.signOut")}
                      </button>
                    </form>
                  </>
                ) : (
                  <AuthModal
                    label={t("nav.login")}
                    variant="nav"
                    defaultTab="login"
                  />
                )}
                <LangSwitcher />
              </nav>
            </div>
          </header>
          <main className="py-10">{children}</main>
        </LocaleProvider>
      </body>
    </html>
  );
}
