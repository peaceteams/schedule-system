import { sendMail } from "../../lib/sendMail.js";

export default async function handler(req, res) {
    try {
        await sendMail(
            process.env.SMTP_USER,
            "SMTP テストメール",
            "SMTP 経由でメール送信が成功しました！"
        );

        res.status(200).json({ ok: true });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
}