export default async function handler(req, res) {
    const body = JSON.parse(req.body || "{}");
    const { password } = body;

    if (password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ ok: false, message: "認証エラー" });
    }

    // 新しい sessionToken を発行
    const sessionToken = "st_" + Math.random().toString(36).slice(2);

    // GitHub API 設定
    const repo = process.env.GH_REPO;
    const token = process.env.GH_PAT;

    // sessionTokens.json を取得
    const getUrl = `https://api.github.com/repos/${repo}/contents/sessionTokens.json`;
    const getRes = await fetch(getUrl, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const getJson = await getRes.json();
    const sha = getJson.sha;
    const currentTokens = JSON.parse(
        Buffer.from(getJson.content, "base64").toString()
    );

    // 新しい token を追加
    currentTokens[sessionToken] = true;

    // GitHub に保存
    const putRes = await fetch(getUrl, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
    },
    body: JSON.stringify({
        message: "Add session token",
        content: Buffer.from(JSON.stringify(currentTokens, null, 2)).toString("base64"),
        sha
    })
    });

    return res.status(200).json({ ok: true, sessionToken });
}