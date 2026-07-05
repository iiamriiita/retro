import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getCurrentUser } from "@/lib/supabase/auth-server";
import { createServiceClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { LocaleProvider } from "@/lib/i18n/client";
import AuthModal from "@/components/AuthModal";
import LangSwitcher from "@/components/LangSwitcher";
import UserMenu from "@/components/UserMenu";
import Image from "next/image";

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

  let team: { name: string; team_size: number | null } | null = null;
  if (user) {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("retro_teams")
      .select("name, team_size")
      .eq("owner_id", user.id)
      .maybeSingle();
    team = data ?? null;
  }

  return (
    <html lang={locale === "zh" ? "zh-Hant" : "en"}>
      <body>
        <LocaleProvider locale={locale}>
          <header
            className="sticky top-0 z-10 border-b border-line"
            style={{ background: "var(--surface)" }}
          >
            <div className="container-wide flex h-[60px] items-center justify-between">
              <Link href="/" className="flex items-center">
                <Image
                  src="/logo.png"
                  alt="Team Retro"
                  width={132}
                  height={22}
                  priority
                />
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
                    <UserMenu
                      email={user.email ?? ""}
                      initialTeamName={team?.name ?? null}
                      initialTeamSize={team?.team_size ?? null}
                      hasTeam={!!team}
                    />
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
          <main className="overflow-x-clip py-10">{children}</main>
        </LocaleProvider>
      </body>
    </html>
  );
}
