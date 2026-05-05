import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AdminRegister() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isWaiting, setIsWaiting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch("/api/adminRegister", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      setMessage("確認メールを送信しました。");
      setIsWaiting(true);
    } else {
      setMessage(data.error || "登録に失敗しました。");
    }
  };

  // ★ Realtime で認証完了を監視
  useEffect(() => {
    if (!isWaiting || !email) return;

    const channel = supabase
      .channel("admin-verification")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "admins",
          filter: `email=eq.${email}`,
        },
        (payload) => {
          console.log("Realtime update:", payload);

          if (payload.new.is_verified === true) {
            window.location.href = "/admin/dashboard";
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isWaiting, email]);

  return (
    <div style={{ maxWidth: 400, margin: "40px auto" }}>
      <h2>管理者登録</h2>

      <form onSubmit={handleSubmit}>
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

        <button type="submit" style={{ width: "100%", padding: "10px" }}>
          登録
        </button>
      </form>

      {message && <p style={{ marginTop: 10 }}>{message}</p>}
    </div>
  );
}