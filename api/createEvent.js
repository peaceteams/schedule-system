export default async function handler(req, res) {
  const body = JSON.parse(req.body || "{}");
  const { name, password } = body;

  // パスワードチェック
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ ok: false, message: "認証エラー" });
  }

  const eventId = "evt_" + Date.now().toString(36);

  const repo = process.env.GH_REPO;
  const token = process.env.GH_PAT;

  async function createFile(path, content) {
    const url = `https://api.github.com/repos/${repo}/contents/${path}`;

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: `Create ${path}`,
        content: Buffer.from(content).toString("base64")
      })
    });

    return response.json();
  }

  await createFile(`events/${eventId}/eventInfo.json`, JSON.stringify({
    eventId,
    name,
    createdAt: new Date().toISOString()
  }, null, 2));

  await createFile(`events/${eventId}/schedule.json`, "{}");
  await createFile(`events/${eventId}/tokens.json`, "{}");
  await createFile(`events/${eventId}/finalSchedule.json`, "{}");

  return res.status(200).json({ ok: true, eventId });
}