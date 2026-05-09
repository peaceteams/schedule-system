// lib/loginNotification.js
import { sendMail } from "@/lib/sendMail";

export async function sendLoginNotification(email, sessionId) {
  const invalidateUrl =
    `${process.env.BASE_URL}/api/invalidate-session?session=${sessionId}`;

  const html = `
    <p>新しい端末からログインがありました。</p>
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
  `;

  await sendMail({
    to: email,
    subject: "ログイン通知",
    html,
  });
}