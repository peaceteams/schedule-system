import { useEffect } from "react";

export default function Verified() {
  useEffect(() => {
    // 5秒後に自動で閉じる
    const timer = setTimeout(() => {
      window.close();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif", textAlign: "center" }}>
      <h2>メール認証が完了しました。</h2>
      <p>このウィンドウは数秒後に自動で閉じます。</p>
    </div>
  );
}