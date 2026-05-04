import { sendMail } from "../lib/sendMail";

function buildMagicLinkTemplate(link) {
  return `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; background-color: #f5f5f5;">
      <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #e5e5e5;">
        <h1 style="font-size: 20px; margin: 0 0 16px; color: #111827;">イベント管理ログインリンク</h1>
        <p style="font-size: 14px; color: #374151; line-height: 1.6; margin: 0 0 16px;">
          以下のボタンをクリックして、イベント管理画面にログインしてください。
        </p>
        <p style="text-align: center; margin: 24px 0;">
          <a href="${link}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 999px; font-size: 14px;">
            ログインする
          </a>
        </p>
        <p style="font-size: 12px; color: #6b7280; line-height: 1.6; margin: 0 0 8px;">
          このリンクは一定時間で無効になります。心当たりがない場合は、このメールは無視してください。
        </p>
        <p style="font-size: 12px; color: #9ca3af; margin: 16px 0 0;">
          PEACE サポートチーム
        </p>
      </div>
    </div>
  `;
}

export default async function handler(req, res) {
  try {
    const html = buildMagicLinkTemplate("https://google.com");

    await sendMail("peacesupportteams@gmail.com", "ログインリンクのお知らせ", html);

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("API ERROR:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
}