import { sendMail } from "../lib/sendMail"; // ← sendMail の場所に合わせて修正

export default async function handler(req, res) {
  console.log("API START");

  try {
    console.log("Before sendMail");
    await sendMail("あなたのメールアドレス", "test", "hello");
    console.log("After sendMail");

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("API ERROR:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
}