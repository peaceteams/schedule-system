export default async function handler(req, res) {
    const repo = process.env.GH_REPO;
    const token = process.env.GH_PAT;

    const url = `https://api.github.com/repos/${repo}/contents/lockout.json`;

    const lockoutRes = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const lockoutJson = await lockoutRes.json();
    const lockout = JSON.parse(Buffer.from(lockoutJson.content, "base64").toString());

    return res.status(200).json({ locked: lockout.locked });
}