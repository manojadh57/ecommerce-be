// import nodemailer from "nodemailer";
// import { config } from "../config/config.js";

// const transporter = nodemailer.createTransport({
//   ...config.mailerOptions,
// });

// // Function to send the verification email
// export const sendVerificationEmail = async (userEmail, verificationLink) => {
//   const mailOptions = {
//     from: `"MANOJ" ${config.mailerOptions.auth.user}`, // Sender address
//     to: userEmail, // Receiver's email
//     subject: "Verify your email address",
//     html: `
//         <h1>Email Verification</h1>
//         <p>Hi,</p>
//         <p>Thank you for signing up. Please verify your email address by clicking the link below:</p>
//         <a href="${verificationLink}" style="display: inline-block; margin: 10px 0; padding: 10px 20px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 5px;">Verify Email</a>
//         <p>If you did not sign up for this account, please ignore this email.</p>
//         <p>Thanks,</p>
//         <p>Your App Team</p>
//       `,
//   };

//   try {
//     const info = await transporter.sendMail(mailOptions);
//     console.log("Email sent: ", info.response);
//   } catch (error) {
//     console.error("Error sending email: ", error);
//   }
// };
