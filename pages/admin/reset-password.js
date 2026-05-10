"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { hashPassword } from "@/lib/hashPassword";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [token, setToken] = useState(null);
  const [ready, setReady] = useState(false);

  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // URL の token を毎回正しく取得する（配列対応）
  useEffect(() => {
    if (!router.isReady) return;

    let t = router.query.token;

    // token が配列なら最初の要素を使う
    if (Array.isArray(t)) {
      t = t[0];
    }

    // 空文字や undefined の場合は null に統一
    if (!t || t.trim().length === 0) {
      t = null;
    }

    setToken(t);
    setReady(true);
  }, [router.isReady, router.query.token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setIsLoading(true);

    const hashedPassword = await hashPassword(password);

    const res = await fetch("/api/resetPassword", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, hashedPassword }),
    });

    const data = await res.json();
    setIsLoading(false);

    if (data.ok) {
      setMessage("パスワードが更新されました。ログイン画面へ移動します…");
      setTimeout(() => {
        window.location.href = "/admin/login";
      }, 1500);
    } else {
      setMessage(data.error);
    }
  }

  // SSR → CSR の不一致を防ぐ
  if (!ready) {
    return <p>読み込み中…</p>;
  }

  // token が無いときだけ無効リンク
  if (!token) {
    return <p>無効なリンクです。</p>;
  }

  return (
    <div style={{ maxWidth: 400, margin: "40px auto" }}>
      <h2>パスワードリセット</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="新しいパスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: "100%", padding: "8px", margin: "8px 0" }}
        />

        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: "100%",
            padding: "10px",
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          {isLoading ? "更新中…" : "パスワードを更新する"}
        </button>
      </form>

      {message && <p style={{ marginTop: 10 }}>{message}</p>}
    </div>
  );
}