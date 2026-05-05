export default async function handler(req, res) {
    const repo = process.env.GH_REPO;
    const token = process.env.GH_PAT;

    // 1. sessionTokens.json を空にする
    await updateFile("sessionTokens.json", {});

    // 2. lockout.json を locked: true にする
    await updateFile("lockout.json", { locked: true });

    return res.status(200).json({ ok: true });
}

async function updateFile(path, obj) {
    const repo = process.env.GH_REPO;
    const token = process.env.GH_PAT;

    const url = `https://api.github.com/repos/${repo}/contents/${path}`;

    const getRes = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const getJson = await getRes.json();
    const sha = getJson.sha;

    await fetch(url, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            message: `Update ${path}`,
            content: Buffer.from(JSON.stringify(obj, null, 2)).toString("base64"),
            sha
        })
    });
}