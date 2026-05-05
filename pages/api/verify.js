import supabase from "@/lib/db";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";

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

    // 5. JWT 発行
    console.log("Generating JWT…");

    const jwtToken = jwt.sign(
      {
        adminId: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("JWT GENERATED:", jwtToken ? "YES" : "NO");

    // 6. Cookie に保存
    console.log("Setting cookie…");

    res.setHeader(
      "Set-Cookie",
      serialize("admin_session", jwtToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 12, // 12時間
      })
    );

    console.log("COOKIE SET");

    // 7. 管理画面へリダイレクト
    console.log("=== VERIFY SUCCESS → REDIRECTING ===");

    return res.redirect("/admin/dashboard");
  } catch (err) {
    console.error("=== VERIFY API FATAL ERROR ===", err);
    return res.status(500).send("Server error");
  }
}