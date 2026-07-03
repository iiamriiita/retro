"use client";

import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const addr = email.trim();
    if (!addr) return;
    setLoading(true);
    setError(null);
    try {
      const supabase = createBrowserSupabase();
      const { error } = await supabase.auth.signInWithOtp({
        email: addr,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "寄送失敗，請稍後再試。");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="card">
        <h1 className="text-lg font-semibold">信件已寄出 📮</h1>
        <p className="mt-2 text-sm text-muted">
          我們寄了一封登入連結到 <span className="font-medium">{email}</span>。
          打開信、點裡面的連結就會自動登入。
        </p>
        <p className="mt-2 text-xs text-muted">
          沒收到？檢查垃圾信匣，或稍等一下再試一次。
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-4">
      <div>
        <h1 className="text-lg font-semibold">登入 / 註冊</h1>
        <p className="mt-1 text-sm text-muted">
          輸入 email，我們寄一封登入連結給你（不用密碼）。
        </p>
      </div>
      <div>
        <label className="field-label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          className="textarea"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "寄送中…" : "寄送登入連結"}
      </button>
    </form>
  );
}
