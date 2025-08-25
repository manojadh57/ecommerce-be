import { emailTransporter } from "./transport.js";
import {
  orderPlacedNotificationTemplate,
  passwordResetOTPsendTemplate,
  sendVerificationEmailTemplate,
  userProfileUpdateNotificationTemplate,
} from "./emailTemplate.js";
import nodemailer from "nodemailer";

//ACTIVATE THE USER
export const sendVerificationEmail = async (obj) => {
  const transport = emailTransporter();

  const info = await transport.sendMail(sendVerificationEmailTemplate(obj));
  console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
  return info.messageId;
};

//GENERATE AND SEND THE OTP TO THE USER VIA EMAIL
export const passwordResetOTPSendEmail = async (obj) => {
  const transport = emailTransporter();
  const info = await transport.sendMail(passwordResetOTPsendTemplate(obj));
  return info.messageId;
};

//MODIFY THE USER ABOUT UPDATING PROFILE
export const userProfileUpdateNotificationEmail = async (obj) => {
  const transport = emailTransporter();
  const info = await transport.sendMail(
    userProfileUpdateNotificationTemplate(obj)
  );
  return info.messageId;
};

//ORDERD HAS BEEN PLACED
export const orderPlacedNotificationEmail = async (obj) => {
  try {
    const transport = emailTransporter();
    const info = await transport.sendMail(orderPlacedNotificationTemplate(obj));
    console.log("Order confirmation email sent: ", info.messageId);
    return info.messageId;
  } catch (error) {
    console.error("Error sending order confirmation email:", error);
    throw error;
  };
};
