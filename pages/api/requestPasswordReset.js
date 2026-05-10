// /api/requestPasswordReset.js
import { requestPasswordResetLogic } from "@/lib/requestPasswordResetLogic";

export default async function handler(req, res) {
  const { email } = req.body;

  await requestPasswordResetLogic(email);

  return res.status(200).json({ ok: true });
}