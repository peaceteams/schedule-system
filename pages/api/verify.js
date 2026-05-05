import supabase from "@/lib/db";

export default async function handler(req, res) {
  console.log("=== VERIFY API START ===");

  try {
    const { token } = req.query;

    console.log("RAW TOKEN FROM URL:", token);

    if (!token) {
      console.log("ERROR: Token missing");
      return res.status(400).send("Token is required");
    }

    // 1. トークンのクリーニング（不可視文字・改行・空白）
    const cleanToken = token
      .trim()
      .replace(/[\r\n]/g, "")
      .replace(/[\u200B-\u200D\uFEFF]/g, "");

    console.log("CLEANED TOKEN:", cleanToken);
    console.log(
      "CLEANED TOKEN RAW:",
      cleanToken.split("").map((c) => c.charCodeAt(0))
    );

    // 2. Supabase から該当ユーザーを取得
    console.log("Fetching user from Supabase…");

    const { data: user, error } = await supabase
      .from("admins")
      .select("*")
      .eq("verification_token", cleanToken)
      .maybeSingle();

    console.log("SUPABASE USER:", user);
    console.log("SUPABASE ERROR:", error);

    if (error || !user) {
      console.log("ERROR: Token not found in DB");
      return res.status(400).send("Invalid or expired token");
    }

    // 3. 有効期限チェック（UTC 同士で比較）
    const now = Date.now();
    const expires = new Date(user.verification_expires).getTime();

    console.log("NOW (ms):", now);
    console.log("EXPIRES (ms):", expires);
    console.log("NOW (ISO):", new Date(now).toISOString());
    console.log("EXPIRES (ISO):", user.verification_expires);

    if (now > expires) {
      console.log("ERROR: Token expired");
      return res.status(400).send("Verification link has expired");
    }

    // 4. 認証成功 → is_verified を true にし、token を無効化
    console.log("Updating user verification status…");

    const { error: updateError } = await supabase
      .from("admins")
      .update({
        is_verified: true,
        verification_token: null,
        verification_expires: null,
      })
      .eq("id", user.id);

    console.log("UPDATE ERROR:", updateError);

    if (updateError) {
      console.log("ERROR: Failed to update verification status");
      return res.status(500).send("Failed to update verification status");
    }

    console.log("=== VERIFY SUCCESS ===");
    return res.status(200).send("Email verified successfully");
  } catch (err) {
    console.error("=== VERIFY API FATAL ERROR ===", err);
    return res.status(500).send("Server error");
  }
}