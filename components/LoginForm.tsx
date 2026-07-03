"use client";

import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";

type Mode = "password" | "otp";
type OtpStep = "email" | "code" | "setpw";

export default function LoginForm() {
  const [mode, setMode] = useState<Mode>("password");
  const [otpStep, setOtpStep] = useState<OtpStep>("email");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function go() {
    // Full navigation so the server/middleware pick up the new auth cookie.
    window.location.assign("/dashboard");
  }

  // --- password login ---
  async function passwordLogin(e: React.FormEvent) {
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
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "登入失敗，請確認 email 與密碼。",
      );
      setLoading(false);
    }
  }

  // --- OTP: send code ---
  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const supabase = createBrowserSupabase();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: true },
      });
      if (error) throw error;
      setOtpStep("code");
      setInfo("驗證碼已寄出，請查看信箱。");
    } catch (err) {
      setError(err instanceof Error ? err.message : "寄送失敗，請稍後再試。");
    } finally {
      setLoading(false);
    }
  }

  // --- OTP: verify code ---
  async function verifyCode(e: React.FormEvent) {
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
      setOtpStep("setpw");
      setInfo("驗證成功！可以設定一組密碼，之後就能直接用密碼登入。");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "驗證碼錯誤或已過期，請重新寄送。",
      );
    } finally {
      setLoading(false);
    }
  }

  // --- set password (optional) ---
  async function setPw(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = createBrowserSupabase();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      go();
    } catch (err) {
      setError(err instanceof Error ? err.message : "設定密碼失敗。");
      setLoading(false);
    }
  }

  const banner = (
    <>
      {info && <p className="text-xs text-emerald-600">{info}</p>}
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </>
  );

  // ---- set-password step ----
  if (mode === "otp" && otpStep === "setpw") {
    return (
      <form onSubmit={setPw} className="card space-y-4">
        <div>
          <h1 className="text-lg font-semibold">設定密碼</h1>
          <p className="mt-1 text-sm text-muted">
            設定一組密碼，下次直接用 email + 密碼登入。也可以略過。
          </p>
        </div>
        <div>
          <label className="field-label" htmlFor="newpw">
            新密碼（至少 6 碼）
          </label>
          <input
            id="newpw"
            type="password"
            className="textarea"
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        {banner}
        <div className="flex gap-2">
          <button
            type="submit"
            className="btn-primary"
            disabled={loading || newPassword.length < 6}
          >
            {loading ? "設定中…" : "設定密碼並進入"}
          </button>
          <button type="button" className="btn-ghost" onClick={go}>
            略過，直接進入
          </button>
        </div>
      </form>
    );
  }

  // ---- OTP code step ----
  if (mode === "otp" && otpStep === "code") {
    return (
      <form onSubmit={verifyCode} className="card space-y-4">
        <div>
          <h1 className="text-lg font-semibold">輸入驗證碼</h1>
          <p className="mt-1 text-sm text-muted">
            我們把 6 位數驗證碼寄到 <span className="font-medium">{email}</span>。
          </p>
        </div>
        <div>
          <label className="field-label" htmlFor="code">
            驗證碼
          </label>
          <input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            className="textarea tracking-[0.4em]"
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>
        {banner}
        <div className="flex gap-2">
          <button
            type="submit"
            className="btn-primary"
            disabled={loading || code.trim().length < 6}
          >
            {loading ? "驗證中…" : "驗證並登入"}
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              setOtpStep("email");
              setCode("");
              setError(null);
            }}
          >
            重新寄送
          </button>
        </div>
      </form>
    );
  }

  // ---- OTP email step ----
  if (mode === "otp") {
    return (
      <form onSubmit={sendCode} className="card space-y-4">
        <div>
          <h1 className="text-lg font-semibold">用驗證碼登入</h1>
          <p className="mt-1 text-sm text-muted">
            第一次來、或忘記密碼？輸入 email，我們寄一組驗證碼給你。
          </p>
        </div>
        <div>
          <label className="field-label" htmlFor="email-otp">
            Email
          </label>
          <input
            id="email-otp"
            type="email"
            required
            className="textarea"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        {banner}
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "寄送中…" : "寄送驗證碼"}
        </button>
        <button
          type="button"
          className="block text-xs text-muted hover:text-ink"
          onClick={() => {
            setMode("password");
            setError(null);
            setInfo(null);
          }}
        >
          ← 用密碼登入
        </button>
      </form>
    );
  }

  // ---- password login (default) ----
  return (
    <form onSubmit={passwordLogin} className="card space-y-4">
      <div>
        <h1 className="text-lg font-semibold">登入</h1>
        <p className="mt-1 text-sm text-muted">用 email 和密碼登入。</p>
      </div>
      <div>
        <label className="field-label" htmlFor="email-pw">
          Email
        </label>
        <input
          id="email-pw"
          type="email"
          required
          className="textarea"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label className="field-label" htmlFor="pw">
          密碼
        </label>
        <input
          id="pw"
          type="password"
          required
          className="textarea"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {banner}
      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "登入中…" : "登入"}
      </button>
      <button
        type="button"
        className="block text-xs text-muted hover:text-ink"
        onClick={() => {
          setMode("otp");
          setOtpStep("email");
          setError(null);
          setInfo(null);
        }}
      >
        第一次登入 / 忘記密碼？用驗證碼 →
      </button>
    </form>
  );
}
