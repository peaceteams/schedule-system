import { serialize } from "cookie";
import { supabase } from "@/lib/db";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  const token = req.query.token;

  const { data: admin, error } = await supabase
    .from("admins")
    .select("*")
    .eq("verification_token", token)
    .single();

  if (!admin) {
    return res.status(400).send("Invalid token");
  }

  // JWT を発行
  const jwtToken = jwt.sign(
    { adminId: admin.id },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );

  // PC に Cookie をセット
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

  // サーバー側リダイレクト
  res.writeHead(302, { Location: "/admin/dashboard" });
  res.end();
}