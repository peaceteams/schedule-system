import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function requestDelete() {
  if (!adminId) return;

  console.log("🗑️ requestDelete 実行:", adminId);

  const res = await fetch("/api/deleteAdmin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ adminId }),
  });

  if (res.ok) {
    setMessage("登録をキャンセルしました。");
    setTimeout(() => window.location.reload(), 2000);
  } else {
    setMessage("削除に失敗しました。");
  }
}

export default function AdminRegister() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isWaiting, setIsWaiting] = useState(false);
  const [adminId, setAdminId] = useState(null);

  // カウントダウン（300秒 = 5分）
  const [remaining, setRemaining] = useState(300);

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
      setAdminId(data.id);
      setIsWaiting(true);
      setRemaining(300); // カウントダウン開始
    } else {
      setMessage(data.error || "登録に失敗しました。");
    }
  };

  // ★ カウントダウン
  useEffect(() => {
    if (!isWaiting) return;

    if (remaining <= 0) {
    console.log("⏳ カウントダウン終了 → 自動削除を実行");
    requestDelete(); // ← ここで削除 API を叩く
    return;
    }

    const timer = setTimeout(() => {
      setRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isWaiting, remaining]);

  // ★ Realtime（UPDATE → 認証成功）
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
            console.log("🎉 認証成功 → verify API を叩きます");

            await fetch(`/api/verify?token=${payload.new.verification_token}`, {
              method: "GET",
              credentials: "include",
            });

            window.location.href = "/admin/dashboard";
          }
        }
      )
      // ★ DELETE（期限切れ → 自動削除）
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "admins",
        },
        (payload) => {
          const deleted = payload.old;

          if (deleted.id === adminId) {
            console.log("🗑️ 自動削除を検知:", deleted);

            setMessage("認証されなかったため、登録をリセットしました。");

            setTimeout(() => {
              window.location.reload();
            }, 3000);
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

  // カウントダウン表示用
  const minutes = Math.floor(remaining / 60);
  const seconds = (remaining % 60).toString().padStart(2, "0");

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

      {isWaiting && (
        <p style={{ marginTop: 10, fontSize: "18px", fontWeight: "bold" }}>
          認証期限: {minutes}:{seconds}
        </p>
      )}
    </div>
  );
}