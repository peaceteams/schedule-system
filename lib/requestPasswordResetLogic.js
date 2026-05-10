// lib/requestPasswordResetLogic.js
import supabase from "@/lib/db";
import { forcePasswordReset } from "@/lib/resetPassword";

export async function requestPasswordResetLogic(email) {
  const { data: admin } = await supabase
    .from("admins")
    .select("*")
    .eq("email", email)
    .single();

  if (!admin) return; // メール存在判定は漏らさない

  // トークンがまだ有効ならメール送らない
  if (admin.reset_token && admin.reset_expires) {
    const expires = new Date(admin.reset_expires).getTime();
    if (expires > Date.now()) return;
  }

  // トークンが無効なら新しいトークンを発行してメール送信
  await forcePasswordReset(admin.id, admin.email);
}