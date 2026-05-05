import supabase from "@/lib/db";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";

export default async function handler(req, res) {
  console.log("=== VERIFY API START ===");

  const token = req.query.token;
  console.log("TOKEN RECEIVED:", token);

  // トークン一致チェック
  const { data: admin, error: findError } = await supabase
    .from("admins")
    .select("*")
    .eq("verification_token", token)
    .maybeSingle();

  console.log("FIND ADMIN RESULT:", { admin, findError });

  if (!admin) {
    console.log("ERROR: Invalid token");
    return res.status(400).send("Invalid token");
  }

  // ★ UPDATE 実行ログ
  console.log("🔧 UPDATE 実行:", admin.id);

  const { data: updated, error: updateError } = await supabase
    .from("admins")
    .update({
      is_verified: true,
      verified_at: new Date().toISOString(), // ← UPDATE を必ず発火させる
    })
    .eq("id", admin.id)
    .select()
    .single();

  // ★ UPDATE 結果ログ
  console.log("🔧 UPDATE 結果:", { updated, updateError });

  if (updateError) {
    console.log("UPDATE ERROR:", updateError);
    return res.status(500).send("Update failed");
  }

  // JWT 発行
  const jwtToken = jwt.sign(
    { id: admin.id, email: admin.email },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );

  res.setHeader(
    "Set-Cookie",
    serialize("admin_session", jwtToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    })
  );

  console.log("=== VERIFY API END (SUCCESS) ===");

  res.setHeader("Content-Type", "text/html");
  return res.end(`
    <html>
      <body>
        <script>
          window.location.href = "/verified";
        </script>
      </body>
    </html>
  `);
}