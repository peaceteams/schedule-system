"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { hashPassword } from "@/lib/client/hashPassword";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AdminLogin({ hasCookie }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [adminId, setAdminId] = useState(null);
  const [isWaiting, setIsWaiting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [expiresAt, setExpiresAt] = useState(null);
  const [countdown, setCountdown] = useState("");
  const [isNewUser, setIsNewUser] = useState(null);

  const DEBUG_EXPIRES = 300;

  // -----------------------------
  // ログインボタン押下
  // -----------------------------
  async function handleLogin(e) {
    e.preventDefault();
    setIsLoading(true);
    setMessage();

    // ★ 追加：パスワードをハッシュ化
    const hashed = await hashPassword(password);

    if (hasCookie) {
      const res = await fetch("/api/directLogin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: hashed }),
      });

      const data = await res.json();
      setIsLoading(false);

      if (data.ok) {
        window.location.href = "/admin/dashboard";
        return;
      } else {
        setMessage(data.error);
        return;
      }
    }

    const res = await fetch("/api/adminLoginOrRegister", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password: hashed,   // ★ ハッシュを送る
        expiresInSeconds: DEBUG_EXPIRES
      }),
    });

    if (!res.ok) {
      let msg = "ログインに失敗しました";

      try {
        const err = await res.json();
        msg = err.message || err.error || msg;
      } catch (e) {
        // JSON じゃない（＝Vercel の HTML）場合
        msg = "アカウントがロックされています。メールからパスワードリセットを行ってください。";
      }

      setMessage(msg);
      setIsLoading(false);
    return;
  }

  // ★ 正常時だけ JSON を読む
  const data = await res.json();
    setIsLoading(false);

    if (data.ok) {
      setAdminId(data.adminId);

      const clientExpiresAt = new Date(Date.now() + (DEBUG_EXPIRES + 1) * 1000).toISOString();
      setExpiresAt(clientExpiresAt);

      setIsWaiting(true);
      setMessage("メールの認証を待っています…");
    } else {
      setMessage(data.error);
    }
  }

  // -----------------------------
  // カウントダウン
  // -----------------------------
  useEffect(() => {
    if (!isWaiting || !expiresAt) return;

    const end = new Date(expiresAt).getTime();

    const update = () => {
      const now = Date.now();
      const diff = Math.max(0, end - now);

      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);

      setCountdown(`${m}:${s.toString().padStart(2, "0")}`);

      return diff;
    };

    update();

    const timer = setInterval(() => {
      const diff = update();

      if (diff <= 0) {
        clearInterval(timer);

        if (isNewUser) {
          setMessage("認証期限が切れました。再度登録してください。");
          fetch("/api/deleteUnverified", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ adminId }),
          });
        } else {
          setMessage("認証期限が切れました。再度ログインしてください。");
          setTimeout(() => window.location.reload(), 1500);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isWaiting, expiresAt]);

  // -----------------------------
  // Realtime 監視 → 認証完了で自動ログイン
  // -----------------------------
  useEffect(() => {
    if (!isWaiting || !adminId) return;

    let alreadyVerified = false; // ← ★追加：二重実行防止フラグ

    const channel = supabase
      .channel("login-verification")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "admins",
        },
        async (payload) => {
          if (
            !alreadyVerified && // ← ★追加：2回目を防ぐ
            payload.new.id === adminId &&
            payload.new.is_verified === true
          ) {
            alreadyVerified = true; // ← ★追加：ここでロック

            await fetch(`/api/verify?token=${payload.new.verification_token}`, {
              method: "GET",
              credentials: "include",
            });

            window.location.href = "/admin/dashboard";
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [isWaiting, adminId]);

  return (
    <div style={{ maxWidth: 400, margin: "40px auto" }}>
      <h2>管理者ログイン</h2>

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: "100%", margin: "8px 0", padding: "8px" }}
        />

        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: "100%", margin: "8px 0", padding: "8px" }}
        />

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "10px",
            opacity: isLoading ? 0.7 : 1,
            cursor: isLoading ? "not-allowed" : "pointer",
          }}
          disabled={isLoading}
        >
          {isLoading ? <span className="dot-loader"></span> : "登録 / ログイン"}
        </button>
      </form>

      {message && <p style={{ marginTop: 10 }}>{message}</p>}

      {isWaiting && (
        <div
          style={{
            marginTop: "15px",
            padding: "10px",
            background: "#fff3cd",
            border: "1px solid #ffeeba",
            borderRadius: "6px",
            color: "#856404",
            fontWeight: "bold",
            textAlign: "center",
          }}
        >
          認証期限: {countdown}
        </div>
      )}
    </div>
  );
}

// -----------------------------
// SSR で Cookie を判定して props に渡す
// -----------------------------
export async function getServerSideProps({ req }) {
  const token = req.cookies.admin_session || null;

  return {
    props: {
      hasCookie: !!token,
    },
  };
}