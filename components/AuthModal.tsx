"use client";

import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n/client";

type View = "login" | "otp";
type OtpMode = "register" | "reset";
type Step = "email" | "code" | "password";

export default function AuthModal({
  label,
  variant = "primary",
  defaultTab = "login",
  defaultOpen = false,
  triggerClassName = "",
}: {
  label: string;
  variant?: "primary" | "nav" | "ghost";
  defaultTab?: "login" | "register";
  defaultOpen?: boolean;
  triggerClassName?: string;
}) {
  const { t } = useT();
  const [open, setOpen] = useState(defaultOpen);
  const [view, setView] = useState<View>(
    defaultTab === "register" ? "otp" : "login",
  );
  const [otpMode, setOtpMode] = useState<OtpMode>("register");
  const [step, setStep] = useState<Step>("email");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [existsSwitch, setExistsSwitch] = useState(false);

  function reset(toRegister = false) {
    setView(toRegister ? "otp" : "login");
    setOtpMode("register");
    setStep("email");
    setPassword("");
    setCode("");
    setNewPassword("");
    setError(null);
    setInfo(null);
    setExistsSwitch(false);
  }

  function openModal() {
    reset(defaultTab === "register");
    setOpen(true);
  }

  function go() {
    window.location.assign("/dashboard");
  }

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = createBrowserSupabase();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      go();
    } catch {
      setError(t("am.loginFail"));
      setLoading(false);
    }
  }

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    setExistsSwitch(false);
    try {
      // Sign-up: block emails that already have an account.
      if (otpMode === "register") {
        const res = await fetch("/api/auth/exists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
        });
        const { exists } = (await res.json()) as { exists?: boolean };
        if (exists) {
          setError(t("am.alreadyRegistered"));
          setExistsSwitch(true);
          setLoading(false);
          return;
        }
      }
      const supabase = createBrowserSupabase();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: otpMode === "register" },
      });
      if (error) throw error;
      setStep("code");
      setInfo(t("am.codeSent"));
    } catch (err) {
      setError(
        otpMode === "reset"
          ? t("am.sendFailReset")
          : err instanceof Error
            ? err.message
            : t("am.sendFail"),
      );
    } finally {
      setLoading(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = createBrowserSupabase();
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: "email",
      });
      if (error) throw error;
      setStep("password");
      setInfo(null);
    } catch {
      setError(t("am.codeError"));
    } finally {
      setLoading(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = createBrowserSupabase();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      go();
    } catch {
      setError(t("am.setPasswordFail"));
      setLoading(false);
    }
  }

  const btnClass =
    variant === "nav"
      ? "text-muted hover:text-ink text-sm"
      : variant === "ghost"
        ? "btn-ghost"
        : "btn-primary";

  return (
    <>
      <button
        type="button"
        className={`${btnClass} ${triggerClassName}`.trim()}
        onClick={openModal}
      >
        {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="mb-5 flex items-end justify-between border-b"
              style={{ borderColor: "var(--border)" }}
            >
              {/* Underline tabs */}
              <div className="flex gap-6 text-[15px]">
                {(
                  [
                    { key: "login", label: t("am.login"), active: view === "login" },
                    {
                      key: "register",
                      label: t("am.register"),
                      active: view === "otp" && otpMode === "register",
                    },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => reset(tab.key === "register")}
                    className={`-mb-px border-b-2 pb-2.5 font-semibold transition-colors ${
                      tab.active
                        ? "text-ink"
                        : "border-transparent text-subtle hover:text-muted"
                    }`}
                    style={tab.active ? { borderColor: "var(--accent)" } : undefined}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="pb-2.5 text-muted hover:text-ink"
                onClick={() => setOpen(false)}
                aria-label={t("am.close")}
              >
                ✕
              </button>
            </div>

            {info && (
              <p className="mb-2 text-xs text-emerald-600">{info}</p>
            )}
            {error && (
              <p className="mb-2 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            {/* Login */}
            {view === "login" && (
              <form onSubmit={login} className="space-y-3">
                <div>
                  <h3 className="text-lg font-extrabold tracking-tight">
                    {t("am.loginTitle")}
                  </h3>
                  <p className="mt-1.5 text-sm text-muted">
                    {t("am.loginHint")}
                  </p>
                </div>
                <div>
                  <label className="field-label">Email</label>
                  <input
                    type="email"
                    required
                    className="textarea"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="field-label">{t("am.password")}</label>
                  <input
                    type="password"
                    required
                    className="textarea"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn-primary w-full" disabled={loading}>
                  {loading ? t("am.loggingIn") : t("am.loginBtn")}
                </button>
                <button
                  type="button"
                  className="block text-xs text-muted hover:text-ink"
                  onClick={() => {
                    setView("otp");
                    setOtpMode("reset");
                    setStep("email");
                    setError(null);
                    setInfo(null);
                  }}
                >
                  {t("am.forgot")}
                </button>
              </form>
            )}

            {/* OTP: email step */}
            {view === "otp" && step === "email" && (
              <form onSubmit={sendCode} className="space-y-3">
                <div>
                  <h3 className="text-lg font-extrabold tracking-tight">
                    {otpMode === "register"
                      ? t("am.registerTitle")
                      : t("am.resetTitle")}
                  </h3>
                  <p className="mt-1.5 text-sm text-muted">{t("am.emailHint")}</p>
                </div>
                <div>
                  <label className="field-label">Email</label>
                  <input
                    type="email"
                    required
                    className="textarea"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn-primary w-full" disabled={loading}>
                  {loading ? t("am.sending") : t("am.sendCode")}
                </button>
                {existsSwitch && (
                  <button
                    type="button"
                    className="block w-full text-center text-sm font-semibold text-[color:var(--gold-700)] hover:underline"
                    onClick={() => reset(false)}
                  >
                    {t("am.goLogin")}
                  </button>
                )}
              </form>
            )}

            {/* OTP: code step */}
            {view === "otp" && step === "code" && (
              <form onSubmit={verify} className="space-y-3">
                <div>
                  <h3 className="text-lg font-extrabold tracking-tight">
                    {t("am.enterCode")}
                  </h3>
                  <p className="mt-1.5 text-sm text-muted">
                    {t("am.sentTo", { email })}
                  </p>
                </div>
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="textarea tracking-[0.4em]"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
                <button
                  type="submit"
                  className="btn-primary w-full"
                  disabled={loading || code.trim().length < 6}
                >
                  {loading ? t("am.verifying") : t("am.verify")}
                </button>
                <button
                  type="button"
                  className="block text-xs text-muted hover:text-ink"
                  onClick={() => {
                    setStep("email");
                    setCode("");
                    setError(null);
                  }}
                >
                  {t("am.resend")}
                </button>
              </form>
            )}

            {/* OTP: set password step */}
            {view === "otp" && step === "password" && (
              <form onSubmit={savePassword} className="space-y-3">
                <div>
                  <h3 className="text-lg font-extrabold tracking-tight">
                    {t("am.setPassword")}
                  </h3>
                  <p className="mt-1.5 text-sm text-muted">
                    {t("am.setPasswordHint")}
                  </p>
                </div>
                <div>
                  <label className="field-label">{t("am.password")}</label>
                  <input
                    type="password"
                    minLength={6}
                    className="textarea"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="btn-primary w-full"
                  disabled={loading || newPassword.length < 6}
                >
                  {loading ? t("am.settingUp") : t("am.setAndEnter")}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
