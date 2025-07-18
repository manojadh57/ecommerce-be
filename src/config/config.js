import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: process.env.PORT || 8000,

  mongodb: {
    url: process.env.MONGODB_URL,
  },

  jwt: {
    secret: process.env.JWT_ACCESS_SECRET || "superSecretAccessKey",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "superSecretRefreshKey",
    expireIn: process.env.JWT_EXPIRE || "1d",
  },

  mailerOptions: {
    host: process.env.SMTP_HOST || "smtp.example.com",
    port: process.env.SMTP_PORT || 587,
    auth: {
      user: process.env.SMTP_USER || process.env.EMAIL_USER,
      pass: process.env.SMTP_PASSWORD || process.env.EMAIL_PASS,
    },
    secure: false,
  },
};
