export default async function handler(req, res) {
    const body = JSON.parse(req.body || "{}");

    // パスワードチェック
    if (body.password !== process.env.admin_password) {
        return res.status(401).json({ ok: false });
    }

    // セッショントークン発行
    const token = Math.random().toString(36).slice(2);

    global.sessionTokens = global.sessionTokens || {};
    global.sessionTokens[token] = true;

    return res.status(200).json({
        ok: true,
        sessionToken: token
    });
}