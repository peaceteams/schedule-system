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

  // Realtime 監視
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