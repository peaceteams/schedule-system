import { useState, useEffect } from "react";

export async function getServerSideProps() {
  return { props: {} };
}

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
      setMessage("確認メールを送信しました。メールを開くと自動で進みます。");
      setIsWaiting(true); // ← ポーリング開始
    } else {
      setMessage(data.error || "登録に失敗しました。");
    }
  };

  // ★ 5秒ごとに認証済みかチェック
  useEffect(() => {
    if (!isWaiting || !email) return;

    const interval = setInterval(async () => {
      const res = await fetch(`/api/checkVerified?email=${email}`);
      const data = await res.json();

      if (data.verified) {
        window.location.href = "/admin/login";
      }
    }, 5000);

    return () => clearInterval(interval);
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