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


//SEND THE OTP TO THE USER 

export const passwordResetOTPsendTemplate = ({email, name, otp}) => {
    return {
           from: `'Local library <${process.env.SMTP_EMAIL}>'`, //sender address
        to: `${email}`, //list of receivers
        subject: 'Reset your password', // subject line
        text: `'Hello ${name}, here is your OTP to reset the password. This will expire in 5 min ${otp}.'`, //plain text
        html: `
         <p>Dear ${name} </p>  
         <br />
         <p>Here is your OTP to reset the password. This will expire in 5 min.
         <br />

         <br/>
         OTP is ${otp}.</p>
         <br />

         Thank you
   
        
        ` 
    }
};


// SEND THE UPDATED INFO ABOUT PROFILE UPDATE 
export const userProfileUpdateNotificationTemplate = ({email , name})=> {
    return {
                from: `'Local library <${process.env.SMTP_EMAIL}>'`, //sender address
        to: `${email}`, //list of receivers
        subject: 'Your account has been updated', // subject line
        text: `'Hello ${name}, your account has been updated. If this wasn't you. Change your password and contact us.'`, //plain text
        html: `
         <p>Dear ${name} </p>  
         <br />
         <p>Your account has been updated. If this wasn't you. Change your password and contact us.
         <br />

         <br/>
        
         <br />

         Thank you
   
        
        ` 
    }
}

