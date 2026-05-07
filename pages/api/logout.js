export default function handler(req, res) {
    res.setHeader(
    "Set-Cookie",
    "admin_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict; Secure"
    );

    return res.status(200).json({ ok: true });
}