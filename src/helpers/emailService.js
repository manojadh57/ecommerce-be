import { emailTransporter } from "./transport.js";
import { passwordResetOTPsendTemplate, sendVerificationEmailTemplate, userProfileUpdateNotificationTemplate } from "./emailTemplate.js";
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
export const userProfileUpdateNotificationEmail = async (obj)=> {
   const transport = emailTransporter();
   const info = await transport.sendMail(userProfileUpdateNotificationTemplate(obj));
   return info.messageId
}
