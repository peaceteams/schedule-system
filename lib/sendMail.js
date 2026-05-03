import { google } from "googleapis";

export async function sendMail(to, subject, html) {
  try {
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      "http://localhost:3000/oauth2callback"
    );

    oAuth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN
    });

    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

    const fromAddress = process.env.GMAIL_ADDRESS;

    const message =
      `To: ${to}\r\n` +
      `From: "PEACE SupportTeams" <${fromAddress}>\r\n` +
      `Subject: ${subject}\r\n` +
      `MIME-Version: 1.0\r\n` +
      `Content-Type: text/html; charset="UTF-8"\r\n` +
      `\r\n` +
      `${html}`;

    const encodedMessage = Buffer.from(message)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

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