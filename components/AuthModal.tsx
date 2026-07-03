"use client";

import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";

type View = "login" | "otp";
type OtpMode = "register" | "reset";
type Step = "email" | "code" | "password";

export default function AuthModal({
  label,
  variant = "primary",
  defaultTab = "login",
  defaultOpen = false,
}: {
  label: string;
  variant?: "primary" | "nav";
  defaultTab?: "login" | "register";
  defaultOpen?: boolean;
}) {
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

  function reset(toRegister = false) {
    setView(toRegister ? "otp" : "login");
    setOtpMode("register");
    setStep("email");
    setPassword("");
    setCode("");
    setNewPassword("");
    setError(null);
    setInfo(null);
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
      setError("登入失敗，請確認 email 與密碼。若還沒註冊，請切到「註冊」。");
      setLoading(false);
    }
  }

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const supabase = createBrowserSupabase();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: otpMode === "register" },
      });
      if (error) throw error;
      setStep("code");
      setInfo("驗證碼已寄出，請查看信箱（含垃圾信匣）。");
    } catch (err) {
      setError(
        otpMode === "reset"
          ? "找不到這個 email 或寄送失敗。"
          : err instanceof Error
            ? err.message
            : "寄送失敗，請稍後再試。",
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
      setError("驗證碼錯誤或已過期，請重新寄送。");
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
      setError("設定密碼失敗，請換一組再試（至少 6 碼）。");
      setLoading(false);
    }
  }

  const btnClass =
    variant === "nav"
      ? "text-muted hover:text-ink text-sm"
      : "btn-primary";

  return (
    <>
      <button type="button" className={btnClass} onClick={openModal}>
        {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-line bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              {/* Tabs */}
              <div className="flex gap-1 rounded-lg bg-gray-100 p-1 text-sm">
                <button
                  type="button"
                  className={`rounded-md px-3 py-1 ${
                    view === "login"
                      ? "bg-white font-medium shadow-sm"
                      : "text-muted"
                  }`}
                  onClick={() => reset(false)}
                >
                  登入
                </button>
                <button
                  type="button"
                  className={`rounded-md px-3 py-1 ${
                    view === "otp" && otpMode === "register"
                      ? "bg-white font-medium shadow-sm"
                      : "text-muted"
                  }`}
                  onClick={() => reset(true)}
                >
                  註冊
                </button>
              </div>
              <button
                type="button"
                className="text-muted hover:text-ink"
                onClick={() => setOpen(false)}
                aria-label="關閉"
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
                  <label className="field-label">密碼</label>
                  <input
                    type="password"
                    required
                    className="textarea"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn-primary w-full" disabled={loading}>
                  {loading ? "登入中…" : "登入"}
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
                  忘記密碼？
                </button>
              </form>
            )}

            {/* OTP: email step */}
            {view === "otp" && step === "email" && (
              <form onSubmit={sendCode} className="space-y-3">
                <p className="text-sm font-medium">
                  {otpMode === "register" ? "註冊新帳號" : "重設密碼"}
                </p>
                <p className="text-xs text-muted">
                  輸入 email，我們寄一組 6 位數驗證碼給你。
                </p>
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
                  {loading ? "寄送中…" : "寄送驗證碼"}
                </button>
              </form>
            )}

            {/* OTP: code step */}
            {view === "otp" && step === "code" && (
              <form onSubmit={verify} className="space-y-3">
                <p className="text-sm font-medium">輸入驗證碼</p>
                <p className="text-xs text-muted">
                  已寄到 <span className="font-medium">{email}</span>。
                </p>
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
                  {loading ? "驗證中…" : "驗證"}
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
                  重新寄送
                </button>
              </form>
            )}

            {/* OTP: set password step */}
            {view === "otp" && step === "password" && (
              <form onSubmit={savePassword} className="space-y-3">
                <p className="text-sm font-medium">設定密碼</p>
                <p className="text-xs text-muted">
                  設定一組密碼（至少 6 碼），之後就用 email + 密碼登入。
                </p>
                <div>
                  <label className="field-label">密碼</label>
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
                  {loading ? "設定中…" : "設定密碼並進入"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
