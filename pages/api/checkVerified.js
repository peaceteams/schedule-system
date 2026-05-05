import { getAdminByEmail } from "@/lib/db";

export default async function handler(req, res) {
  const { email } = req.query;

  const admin = await getAdminByEmail(email);

  if (!admin) {
    return res.status(404).json({ verified: false });
  }

  return res.status(200).json({ verified: admin.is_verified === true });
}