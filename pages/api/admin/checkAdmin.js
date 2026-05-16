import supabase from "@/lib/db";

export default async function handler(req, res) {
  const { email } = req.body;

  const { data } = await supabase
    .from("admins")
    .select("id")
    .eq("email", email)
    .single();

  res.status(200).json({ exists: !!data });
}