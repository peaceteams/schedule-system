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
  const [adminId, setAdminId] = useState(null);

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
      setAdminId(data.id);   // ← ID を保存
      setIsWaiting(true);
    } else {
      setMessage(data.error || "登録に失敗しました。");
    }
  };

  // ★ ID で Realtime を購読（最強に安定）
  useEffect(() => {
    if (!isWaiting || !adminId) return;

    console.log("📡 Realtime チャンネル開始:", adminId);

    const channel = supabase
      .channel("admin-verification")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "admins",
        },
        async (payload) => {
          if (payload.new.is_verified === true) {
            console.log("🎉 is_verified が true → PC が verify API を叩きます");

            const res = await fetch(`/api/admin/verify?token=${payload.new.verification_token}`, {
              method: "GET",
              credentials: "include", // Cookie を受け取るために必須
            });

            // Cookie が保存されたか確認
            const cookies = document.cookie;
            if (cookies.includes("admin_session")) {
              console.log("🍪 Cookie 保存成功:", cookies);
            } else {
              console.log("⚠ Cookie が保存されていません:", cookies);
            }

            window.location.href = "/admin/dashboard";
          }
        }
      )
      .subscribe((status) => {
        console.log("📡 Realtime status:", status);
      });

    return () => {
      console.log("❌ Realtime チャンネル削除");
      supabase.removeChannel(channel);
    };
  }, [isWaiting, adminId]);

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