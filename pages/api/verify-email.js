import { supabase } from "../../lib/db";

export default async function handler(req, res) {
  const token = req.query.token;

  // token で admin を検索
  const { data: admin, error } = await supabase
    .from("admins")
    .select("*")
    .eq("verification_token", token)
    .single();

  if (!admin) {
    return res.status(400).send("Invalid token");
  }

  // is_verified を true にする
  await supabase
    .from("admins")
    .update({ is_verified: true })
    .eq("id", admin.id);

  // Cookie はセットしない
  // 最後に /verified にリダイレクト
  res.writeHead(302, { Location: "/verified" });
  res.end();
}