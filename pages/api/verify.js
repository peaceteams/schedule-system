import supabase from "@/lib/db";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";

export default async function handler(req, res) {
  const token = req.query.token;

  const { data: admin } = await supabase
    .from("admins")
    .select("*")
    .eq("verification_token", token)
    .maybeSingle();

  if (!admin) {
    return res.status(400).send("Invalid token");
  }

  // 認証済みに更新（Realtime が発火）
  await supabase
    .from("admins")
    .update({ is_verified: true })
    .eq("id", admin.id);

  // JWT 発行
  const jwtToken = jwt.sign(
    { id: admin.id, email: admin.email },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );

  // Cookie 設定（ローカルは secure:false）
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

  // ★ redirect を使わず HTML を返す（これが最強）
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