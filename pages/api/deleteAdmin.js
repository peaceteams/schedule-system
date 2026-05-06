import supabase from "@/lib/db";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { adminId } = req.body;

  if (!adminId) {
    return res.status(400).json({ error: "adminId is required" });
  }

  const { error } = await supabase
    .from("admins")
    .delete()
    .eq("id", adminId);

  if (error) {
    console.error("Delete error:", error);
    return res.status(500).json({ error: "Failed to delete admin" });
  }

  return res.status(200).json({ success: true });
}