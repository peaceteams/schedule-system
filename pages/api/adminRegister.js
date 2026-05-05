import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendMail } from "@/lib/sendMail";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  console.log("=== adminRegister API START ===");

  try {
    console.log("REQUEST METHOD:", req.method);
    console.log("REQUEST BODY:", req.body);

    if (req.method !== "POST") {
      console.log("ERROR: Method not allowed");
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { email, password } = req.body;

    console.log("EMAIL:", email);
    console.log("PASSWORD LENGTH:", password?.length);

    if (!email || !password) {
      console.log("ERROR: Missing email or password");
      return res.status(400).json({ error: "email と password が必要です" });
    }

    // パスワードハッシュ
    const passwordHash = await bcrypt.hash(password, 10);
    console.log("PASSWORD HASH GENERATED:", passwordHash.slice(0, 10) + "...");

    // トークン生成
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 5);
    console.log("TOKEN GENERATED:", token, "LENGTH:", token.length);
    console.log("TOKEN EXPIRES:", expires.toISOString());

    // 仮登録
    console.log("=== INSERTING INTO SUPABASE ===");
    const { data, error } = await supabase
      .from("admins")
      .insert({
        email,
        password_hash: passwordHash,
        is_verified: false,
        verification_token: token,
        verification_expires: expires.toISOString(),
      })
      .select()
      .single();

    console.log("INSERT RESULT DATA:", data);
    console.log("INSERT RESULT ERROR:", error);

    if (error || !data) {
      console.log("ERROR: Insert failed");
      return res.status(500).json({
        error: "Insert failed",
        details: error,
      });
    }

    console.log("INSERT SUCCESS. NEW ADMIN ID:", data.id);

    // メール送信
    const verifyUrl = `${process.env.BASE_URL}/api/verify?token=${token}`;
    console.log("VERIFY URL:", verifyUrl);

    try {
      console.log("=== SENDING EMAIL ===");
      await sendMail({
        to: email,
        subject: "管理者登録の確認",
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
      console.log("EMAIL SENT SUCCESSFULLY");
    } catch (mailError) {
      console.log("EMAIL SEND ERROR:", mailError);
      return res.status(500).json({
        error: "メール送信に失敗しました",
        details: mailError.toString(),
      });
    }

    console.log("=== adminRegister API END (SUCCESS) ===");

    return res.status(200).json({
      ok: true,
      message: "メール送信しました",
      id: data.id,
    });

  } catch (fatal) {
    console.log("=== FATAL ERROR IN adminRegister ===");
    console.log(fatal);

    return res.status(500).json({
      error: "Fatal error",
      details: fatal.toString(),
    });
  }
}
