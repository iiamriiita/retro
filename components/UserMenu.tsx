"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import TeamModal from "@/components/TeamModal";
import { useT } from "@/lib/i18n/client";

const SKIP_KEY = "retro_team_setup_skipped";

export default function UserMenu({
  email,
  initialTeamName,
  initialTeamSize,
  hasTeam,
}: {
  email: string;
  initialTeamName: string | null;
  initialTeamSize: number | null;
  hasTeam: boolean;
}) {
  const { t } = useT();
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [onboarding, setOnboarding] = useState(false);
  const [teamName, setTeamName] = useState(initialTeamName);
  const [teamSize, setTeamSize] = useState(initialTeamSize);

  // First-login onboarding: open the setup popup automatically when the user
  // has no team yet (unless they've skipped it in this browser).
  useEffect(() => {
    if (hasTeam) return;
    const skipped =
      typeof window !== "undefined" && localStorage.getItem(SKIP_KEY) === "1";
    if (!skipped) {
      setOnboarding(true);
      setModalOpen(true);
    }
  }, [hasTeam]);

  function openEdit() {
    setOnboarding(false);
    setModalOpen(true);
    setMenuOpen(false);
  }

  function closeModal() {
    if (onboarding && typeof window !== "undefined") {
      localStorage.setItem(SKIP_KEY, "1");
    }
    setModalOpen(false);
  }

  const label = teamName || email;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        className="flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"
      >
        <span className="max-w-[160px] truncate">{label}</span>
        <Icon name="chevron-down" size={15} />
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div
            className="absolute right-0 z-50 mt-2 w-52 rounded-xl bg-white p-1 shadow-xl"
            style={{ boxShadow: "0 10px 28px rgba(24,15,9,.2)" }}
          >
            <div className="px-3 py-2">
              <p className="truncate text-sm font-semibold">{label}</p>
              {teamName && (
                <p className="truncate text-xs text-subtle">{email}</p>
              )}
            </div>
            <div className="my-1 h-px bg-line" />
            <button
              onClick={openEdit}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-[color:var(--surface-2)]"
            >
              <Icon name="settings" size={15} />
              {t("nav.teamSettings")}
            </button>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-[color:var(--surface-2)]"
              >
                <Icon name="log-out" size={15} />
                {t("nav.signOut")}
              </button>
            </form>
          </div>
        </>
      )}

      <TeamModal
        open={modalOpen}
        onboarding={onboarding}
        initialName={teamName ?? ""}
        initialSize={teamSize}
        onClose={closeModal}
        onSaved={(name, size) => {
          setTeamName(name);
          setTeamSize(size);
          setModalOpen(false);
        }}
      />
    </div>
  );
}
