import nodemailer from "nodemailer";

// Function to send the verification email
export const sendVerificationEmailTemplate = ({
  email,
  url,
  name,
}) => {
    console.log(email)
  return {
    from: `AusTech <${process.env.SMTP_EMAIL}>`, // Sender address
    to: `${email}`, // Receiver's email
    subject: "Verify your email address",
    html: `
        <h1>Email Verification</h1>
        <p>Hi, ${name}</p>
        <p>Thank you for signing up. Please verify your email address by clicking the link below:</p>
        <a href="${url}" style="display: inline-block; margin: 10px 0; padding: 10px 20px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 5px;">Verify Email</a>
        <p>If you did not sign up for this account, please ignore this email.</p>
        <p>Thanks,</p>
        <p>Your App Team</p>
      `,
  };
};
