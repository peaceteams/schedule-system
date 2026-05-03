export default async function handler(req, res) {
    const body = JSON.parse(req.body || "{}");
    const { password } = body;

    const repo = process.env.GH_REPO;
    const token = process.env.GH_PAT;

    // 1. ロックアウト確認
    const lockoutUrl = `https://api.github.com/repos/${repo}/contents/lockout.json`;
    const lockoutRes = await fetch(lockoutUrl, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const lockoutJson = await lockoutRes.json();
    const lockout = JSON.parse(Buffer.from(lockoutJson.content, "base64").toString());

    if (lockout.locked === true) {
        return res.status(403).json({
            ok: false,
            message: "現在ログインできません（ロックアウト中）"
        });
    }

    // 2. パスワードチェック
    if (password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ ok: false, message: "認証エラー" });
    }

    // 3. 新しい sessionToken を発行
    const sessionToken = "st_" + Math.random().toString(36).slice(2);

    // 4. sessionTokens.json を更新
    const tokensUrl = `https://api.github.com/repos/${repo}/contents/sessionTokens.json`;
    const tokensRes = await fetch(tokensUrl, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const tokensJson = await tokensRes.json();
    const sha = tokensJson.sha;
    const tokens = JSON.parse(Buffer.from(tokensJson.content, "base64").toString());

    tokens[sessionToken] = true;

    await fetch(tokensUrl, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            message: "Add session token",
            content: Buffer.from(JSON.stringify(tokens, null, 2)).toString("base64"),
            sha
        })
    });

    return res.status(200).json({ ok: true, sessionToken });
}