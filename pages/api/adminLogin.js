import supabase from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendMail } from "@/lib/sendMail";

export default async function handler(req, res) {
    const { email, password } = req.body;

    // 1. admin を取得
    const { data: admin } = await supabase
    .from("admins")
    .select("*")
    .eq("email", email)
    .single();

    if (!admin) {
        return res.status(400).json({ error: "メールが見つかりません" });
    }

    // 2. パスワードチェック
    const ok = await bcrypt.compare(password, admin.password_hash);
    if (!ok) {
        return res.status(400).json({ error: "パスワードが違います" });
    }

    // 3. verification_token を発行（毎回）
    const token = crypto.randomBytes(32).toString("hex");

    await supabase
    .from("admins")
    .update({
        verification_token: token,
    })
    .eq("id", admin.id);

    // 4. メール送信
    const verifyUrl = `${process.env.BASE_URL}/api/verify-email?token=${token}`;
    await sendMail({
        to: email,
        subject: "ログイン認証",
        html: `
          <p>以下のボタンをクリックしてメールアドレスを確認してください。</p>
          <a href="${verifyUrl}"
            style="
              display: inline-block;
              padding: 12px 20px;
              background-color: #4CAF50;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              font-size: 16px;
              font-weight: bold;
            ">
            メールアドレスを確認する
          </a>
          <p>このリンクは5分間有効です。</p>
        `
    });

    // 5. adminId を返す（Realtime 用）
    return res.status(200).json({ ok: true, adminId: admin.id });
}