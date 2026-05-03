export default async function handler(req, res) {
    const body = JSON.parse(req.body || "{}");
    const { password } = body;

    if (password === process.env.ADMIN_PASSWORD) {
    return res.status(200).json({ ok: true });
    }

    return res.status(401).json({ ok: false, message: "認証エラー" });
}