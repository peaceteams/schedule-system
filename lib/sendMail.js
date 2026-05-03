import nodemailer from "nodemailer";

export async function sendMail(to, subject, text) {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,     // smtp.office365.com
        port: Number(process.env.SMTP_PORT), // 587
        secure: false, // TLS
        auth: {
            user: process.env.SMTP_USER,  // Outlook メールアドレス
            pass: process.env.SMTP_PASS   // アプリパスワード
        }
    });

    await transporter.sendMail({
        from: process.env.SMTP_USER,
        to,
        subject,
        text
    });
}