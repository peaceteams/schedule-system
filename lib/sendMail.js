import { google } from "googleapis";

export async function sendMail(to, subject, text) {
  try {
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      "http://localhost:3000/oauth2callback"
    );

    oAuth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN
    });

    const accessToken = await oAuth2Client.getAccessToken();

    // Gmail API に送る MIME メールを作成
    const message =
      `To: ${to}\r\n` +
      `Subject: ${subject}\r\n` +
      `Content-Type: text/plain; charset="UTF-8"\r\n` +
      `\r\n` +
      `${text}`;

    // Base64URL エンコード
    const encodedMessage = Buffer.from(message)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

    const res = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage
      }
    });

    return res.data;

  } catch (err) {
    console.error("sendMail error:", err);
    throw err;
  }
}
