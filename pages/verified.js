import { useEffect } from "react";

export default function Verified() {
  useEffect(() => {
    setTimeout(() => {
      window.close();
    }, 1500);
  }, []);

  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h2>認証が完了しました。</h2>
      <p>このウィンドウは自動で閉じます。</p>
    </div>
  );
}