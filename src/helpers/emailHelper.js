import nodemailer from "nodemailer";
import { config } from "../config/config.js";

const emailEnabled = String(process.env.EMAIL_ENABLED ?? "true") === "true";

const transporter = nodemailer.createTransport({
  ...config.mailerOptions,
});

const FROM =
  process.env.EMAIL_FROM ||
  `"MANOJ" ${
    config?.mailerOptions?.auth?.user || process.env.EMAIL_USER || ""
  }`;

//  Verification
export const sendVerificationEmail = async (userEmail, verificationLink) => {
  if (!emailEnabled) {
    console.log("[EMAIL_DISABLED] verify", { to: userEmail, verificationLink });
    return;
  }

  const mailOptions = {
    from: FROM,
    to: userEmail,
    subject: "Verify your email address",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto">
        <h2>Email Verification</h2>
        <p>Thanks for signing up. Click the button below to verify your email:</p>
        <p><a href="${verificationLink}" style="display:inline-block;padding:10px 16px;background:#0d6efd;color:#fff;text-decoration:none;border-radius:6px">Verify Email</a></p>
        <p>If you didn’t create this account, you can ignore this email.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Verification email sent:", info.messageId);
  } catch (error) {
    console.error("Error sending verification email:", error);
  }
};

// Order status
export const sendOrderStatusEmail = async ({ to, status, order }) => {
  if (!emailEnabled) {
    console.log("[EMAIL_DISABLED] order", { to, status, orderId: order?._id });
    return;
  }

  const pretty =
    {
      pending: "placed",
      shipped: "shipped",
      delivered: "delivered",
      cancelled: "cancelled",
    }[status] || status;

  const items =
    (order?.products || [])
      .map(
        (p) => `<li>${p?.productId?.name || "Item"} × ${p?.quantity || 1}</li>`
      )
      .join("") || "<li>(no items)</li>";

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto">
      <h2>Order ${String(pretty).toUpperCase()}</h2>
      <p>Order ID: <b>${order?._id || ""}</b></p>
      <ul>${items}</ul>
      <p><b>Total:</b> $${((order?.totalAmount || 0) / 100).toFixed(2)}</p>
      <p>We’ll keep you posted on any updates.</p>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: FROM,
      to,
      subject: `Your order is ${pretty}`,
      html,
    });
    console.log("Order email sent:", info.messageId);
  } catch (err) {
    console.error("Error sending order email:", err);
  }
};

// Password reset
export const sendPasswordResetEmail = async (to, link) => {
  if (!emailEnabled) {
    console.log("[EMAIL_DISABLED] reset", { to, link });
    return;
  }

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto">
      <h2>Password reset</h2>
      <p>Click the button below to reset your password. This link expires in 15 minutes.</p>
      <p><a href="${link}" style="display:inline-block;padding:10px 16px;background:#0d6efd;color:#fff;text-decoration:none;border-radius:6px">Reset password</a></p>
      <p>If you didn’t request this, you can ignore this email.</p>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: FROM,
      to,
      subject: "Reset your password",
      html,
    });
    console.log("Reset email sent:", info.messageId);
  } catch (error) {
    console.error("Error sending reset email:", error);
  }
};
