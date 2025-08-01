import { emailTransporter } from "./transport.js";
import { sendVerificationEmailTemplate } from "./emailTemplate.js";
import nodemailer from "nodemailer";

export const sendVerificationEmail = async (obj) => {
  const transport = emailTransporter();

  const info = await transport.sendMail(sendVerificationEmailTemplate(obj));
  console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
  return info.messageId;
};
