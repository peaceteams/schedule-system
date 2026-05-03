import nodemailer from "nodemailer";
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

    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
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

    } catch (err) {
        console.error("sendMail error:", err);
        throw err;
    }
}