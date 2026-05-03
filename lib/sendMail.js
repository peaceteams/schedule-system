import nodemailer from "nodemailer";
import { google } from "googleapis";

export async function sendMail(to, subject, text) {
    const oAuth2Client = new google.auth.OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
        "urn:ietf:wg:oauth:2.0:oob"
    );

    oAuth2Client.setCredentials({
        refresh_token: process.env.GMAIL_REFRESH_TOKEN
    });

    const accessToken = await oAuth2Client.getAccessToken();

    console.log("accessToken:", accessToken);
    console.log("accessToken.token:", accessToken?.token);

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            type: "OAuth2",
            user: process.env.GMAIL_USER,
            clientId: process.env.GMAIL_CLIENT_ID,
            clientSecret: process.env.GMAIL_CLIENT_SECRET,
            refreshToken: process.env.GMAIL_REFRESH_TOKEN,
            accessToken: accessToken.token
        }
    });

    await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to,
        subject,
        text
    });
}
