"use client";

import { useState, useEffect } from "react";
import { hashPassword } from "@/lib/hashPassword";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("token");
    setToken(t);
    setIsReady(true);
  }, []);

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

  if (!isReady) {
    return <p>読み込み中…</p>;
  }

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