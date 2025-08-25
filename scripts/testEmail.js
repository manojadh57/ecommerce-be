import nodemailer from "nodemailer";
import "dotenv/config";

async function main() {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: String(process.env.SMTP_SECURE) === "true",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  await transporter.verify(); // checks login without sending
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    subject: "SMTP test",
    html: "<p>Gmail SMTP working ✅</p>",
  });

  console.log("OK messageId:", info.messageId);
}

main().catch((e) => {
  console.error("SMTP test failed:", e);
  process.exit(1);
});
