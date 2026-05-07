import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [adminId, setAdminId] = useState(null);
  const [isWaiting, setIsWaiting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // -----------------------------
  // 1. Cookie が残っていたら即ダッシュボードへ
  // -----------------------------
  useEffect(() => {
    if (document.cookie.includes("admin_session")) {
      window.location.href = "/admin/dashboard";
    }
  }, []);

  // -----------------------------
  // 2. ログイン処理（Cookie が無い場合のみ実行）
  // -----------------------------
  async function handleLogin(e) {
    e.preventDefault();
    setIsLoading(true);

    const res = await fetch("/api/adminLogin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    setIsLoading(false);

    if (data.ok) {
      setAdminId(data.adminId);
      setIsWaiting(true);
      setMessage("メールの認証を待っています…");
    } else {
      setMessage(data.error);
    }
  }

  // -----------------------------
  // 3. Realtime 監視（adminId 限定）
  // -----------------------------
  useEffect(() => {
    if (!isWaiting || !adminId) return;

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
          if (payload.new.id === adminId && payload.new.is_verified === true) {
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
          {isLoading ? <span className="dot-loader"></span> : "ログイン"}
        </button>
      </form>

      {message && <p style={{ marginTop: 10 }}>{message}</p>}
    </div>
  );
}

// -----------------------------
// 4. SSR 認証（ログイン済みなら login を開けない）
// -----------------------------
export async function getServerSideProps({ req }) {
  const token = req.cookies.admin_session;

  if (token) {
    const jwt = require("jsonwebtoken");
    try {
      jwt.verify(token, process.env.JWT_SECRET);
      return {
        redirect: {
          destination: "/admin/dashboard",
          permanent: false,
        },
      };
    } catch (e) {
      // 壊れた JWT → 無視してログイン画面を表示
    }
  }

  return { props: {} };
}