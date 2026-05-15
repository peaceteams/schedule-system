// lib/loginNotification.js
import { sendMail } from "@/lib/sendMail";

export async function sendLoginNotification(email, sessionId, ip, geo) {
  const invalidateUrl =
    `${process.env.BASE_URL}/api/invalidate-session?session=${sessionId}`;

  // 現在時刻（日本時間）
  const now = new Date();
  const jpTime = now.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });

  // 件名を毎回ユニーク化（遅延対策）
  const subject = `ログイン通知 (${jpTime})`;

  const html = `
    <p>新しい端末からログインがありました。</p>

    <p><strong>IPアドレス:</strong> ${ip || "取得不可"}</p>
    <p><strong>地域:</strong> ${geo?.country || "不明"} / ${geo?.region || ""}</p>

    <p>心当たりがない場合は、以下のボタンを押してこの端末だけログアウトできます。</p>

    <a href="${invalidateUrl}"
      style="
        display: inline-block;
        padding: 12px 20px;
        background-color: #e53935;
        color: white;
        text-decoration: none;
        border-radius: 6px;
        font-size: 16px;
        font-weight: bold;
      ">
      この端末をログアウトする
    </a>

    <p>※この操作は他の端末には影響しません。</p>

    <hr />
    <p style="font-size: 12px; color: #666;">
      送信日時：${jpTime}
    </p>
  `;

  await sendMail({
    to: email,
    subject,
    html,
  });
}