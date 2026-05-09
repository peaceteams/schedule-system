// lib/resetPassword.js
import supabase from "@/lib/db";
import { sendMail } from "@/lib/sendMail";

export async function forcePasswordReset(adminId, email) {
  // 1. must_reset_password を true にする
  await supabase
    .from("admins")
    .update({ must_reset_password: true })
    .eq("id", adminId);

  // 2. パスワードリセットメール送信
  const resetUrl = `${process.env.BASE_URL}/admin/reset-password`;

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
  `;

  await sendMail({
    to: email,
    subject: "パスワード再設定のお願い",
    html,
  });

  return true;
}