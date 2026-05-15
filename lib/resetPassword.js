// lib/resetPassword.js
import supabase from "@/lib/db";
import { sendMail } from "@/lib/sendMail";
import crypto from "crypto";

export async function forcePasswordReset(adminId, email) {
  // 1. リセット用トークンを生成（10分有効）
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 10).toISOString(); // 10分

  // 2. must_reset_password を true にし、token を保存
  await supabase
    .from("admins")
    .update({
      must_reset_password: true,
      reset_token: token,
      reset_expires: expires,
    })
    .eq("id", adminId);

  // 3. パスワードリセットメール送信
  // 現在時刻（日本時間）
  const now = new Date();
  const jpTime = now.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });

  // 件名を毎回ユニーク化（遅延対策）
  const subject = `パスワード再設定のお願い (${jpTime})`;

  const resetUrl = `${process.env.BASE_URL}/admin/reset-password?token=${token}`;

  const html = `
    <p>セキュリティ保護のため、パスワードの再設定が必要です。</p>
    <p>以下のリンクから新しいパスワードを設定してください。</p>
    <a href="${resetUrl}"
      style="
        display:inline-block;
        padding:12px 20px;
        background:#1976d2;
        color:white;
        text-decoration:none;
        border-radius:6px;
        font-size:16px;
        font-weight:bold;
      ">
      パスワードを再設定する
    </a>
    <p>※この操作を行うまで、新しいログインはブロックされます。</p>
    <p>※このリンクは10分間有効です。</p>

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

  return true;
}