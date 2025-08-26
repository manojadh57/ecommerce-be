import crypto from "crypto";

import {
  createNewUser,
  getUserByEmail,
  updateUser,
} from "../models/user/UserModel.js";

import {
  signAccessJWT,
  signRefreshJWT,
  verifyRefreshJWT,
} from "../utils/jwtHelper.js";

import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "../helpers/emailHelper.js";
import { hashPassword, comparePassword } from "../utils/bcrypt.js";

const BASE_URL =
  process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 8001}`;

const getFrontendBase = (req) => {
  const fromEnv = process.env.APP_BASE_URL?.trim();
  const fromOrigin = req.get?.("origin");
  return (fromEnv || fromOrigin || "http://localhost:5173").replace(/\/+$/, "");
};

// SIGNUP
export const signup = async (req, res) => {
  try {
    const fName = req.body.fName ?? req.body.firstName;
    const lName = req.body.lName ?? req.body.lastName;
    const email = (req.body.email || "").toLowerCase().trim();
    const password = req.body.password;

    if (!fName || !lName || !email || !password) {
      return res
        .status(400)
        .json({ status: "error", message: "All fields required" });
    }

    const exists = await getUserByEmail(email);
    if (exists) {
      return res
        .status(409)
        .json({ status: "error", message: "Email already registered" });
    }

    const hashed = await hashPassword(password);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    await createNewUser({
      fName,
      lName,
      email,
      password: hashed,
      isVerified: false,
      verificationToken,
    });

    //  Build FE link dynamically (env/Origin-aware)
    const FE_BASE = getFrontendBase(req);
    const link = `${FE_BASE}/verify-email/${verificationToken}`;

    try {
      await sendVerificationEmail(email, link);
    } catch (mailErr) {
      console.error(
        "sendVerificationEmail failed:",
        mailErr?.message || mailErr
      );
      return res.status(201).json({
        status: "partial",
        message:
          "Signup created, but verification email could not be sent. Please try again shortly.",
      });
    }

    return res.status(201).json({
      status: "success",
      message: "Signup successful. Check your email to verify your account.",
    });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ status: "error", message: "Signup failed" });
  }
};

//  VERIFY EMAIL
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token)
      return res
        .status(400)
        .json({ status: "error", message: "Missing token" });

    const user = await updateUser(
      { verificationToken: token, isVerified: false },
      { isVerified: true, verificationToken: "" }
    );

    if (!user) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid or already verified" });
    }

    return res.json({
      status: "success",
      message: "Email verified successfully",
    });
  } catch (err) {
    console.error("Email verification error:", err);
    return res
      .status(500)
      .json({ status: "error", message: "Could not verify email" });
  }
};

// ============ LOGIN ============
export const login = async (req, res) => {
  try {
    const email = (req.body.email || "").toLowerCase().trim();
    const { password } = req.body;

    if (!email.includes("@") || !password) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid login details" });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return res
        .status(401)
        .json({ status: "error", message: "Invalid login details" });
    }

    if (!user.isVerified) {
      return res
        .status(403)
        .json({ status: "error", message: "Please verify your email" });
    }

    const pwMatch = await comparePassword(password, user.password);
    if (!pwMatch) {
      return res
        .status(401)
        .json({ status: "error", message: "Invalid login details" });
    }

    const accessJWT = await signAccessJWT({ email, id: user._id });
    const refreshJWT = await signRefreshJWT({ email, id: user._id });

    await updateUser({ email }, { refreshJWT });

    const safeUser = {
      _id: user._id,
      fName: user.fName,
      lName: user.lName,
      email: user.email,
      isVerified: user.isVerified,
    };

    return res.json({
      status: "success",
      message: "User authenticated",
      tokens: { accessJWT, refreshJWT },
      user: safeUser,
    });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ status: "error", message: "Login failed" });
  }
};

// REFRESH ACCESS TOKEN
export const refreshAccess = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res
        .status(400)
        .json({ status: "error", message: "refreshToken missing" });
    }

    let decoded;
    try {
      decoded = verifyRefreshJWT(token);
    } catch {
      return res
        .status(401)
        .json({ status: "error", message: "Invalid refresh token" });
    }

    const email = (decoded.email || "").toLowerCase();
    const user = await getUserByEmail(email);

    if (!user || user.refreshJWT !== token) {
      return res
        .status(401)
        .json({ status: "error", message: "Invalid refresh token" });
    }

    const accessJWT = await signAccessJWT({ email, id: user._id });
    const newRefresh = await signRefreshJWT({ email, id: user._id });

    await updateUser({ email }, { refreshJWT: newRefresh });

    return res.json({
      status: "success",
      tokens: { accessJWT, refreshJWT: newRefresh },
    });
  } catch (err) {
    console.error("refreshAccess error:", err);
    return res.status(500).json({ status: "error", message: err.message });
  }
};

// REQUEST PASSWORD RESET
export const requestPasswordReset = async (req, res) => {
  try {
    const email = (req.body.email || "").toLowerCase().trim();

    if (!email) {
      return res.json({
        status: "success",
        message: "If the account exists, a reset link has been sent.",
      });
    }

    const user = await getUserByEmail(email);
    if (user) {
      const raw = crypto.randomBytes(32).toString("hex");
      const hashed = crypto.createHash("sha256").update(raw).digest("hex");
      const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      await updateUser(
        { email },
        { resetPasswordToken: hashed, resetPasswordExpires: expires }
      );

      // Build FE link dynamically here too
      const FE_BASE = getFrontendBase(req);
      const link = `${FE_BASE}/reset-password/${raw}`;

      try {
        await sendPasswordResetEmail(email, link);
      } catch (e) {
        console.error("Reset email failed:", e?.message || e);
      }
    }

    return res.json({
      status: "success",
      message: "If the account exists, a reset link has been sent.",
    });
  } catch (err) {
    console.error("requestPasswordReset error:", err);
    return res.json({
      status: "success",
      message: "If the account exists, a reset link has been sent.",
    });
  }
};

// RESET PASSWORD WITH TOKEN
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({
        status: "error",
        message: "Token and new password are required",
      });
    }

    const hashed = crypto.createHash("sha256").update(token).digest("hex");
    const now = new Date();

    const user = await updateUser(
      { resetPasswordToken: hashed, resetPasswordExpires: { $gt: now } },
      { resetPasswordToken: "", resetPasswordExpires: null }
    );

    if (!user) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid or expired reset link" });
    }

    const newHash = await hashPassword(password);

    // set new password and invalidate existing refresh session(s)
    await updateUser(
      { email: user.email.toLowerCase() },
      { password: newHash, refreshJWT: "" }
    );

    return res.json({
      status: "success",
      message: "Password has been reset. Please log in.",
    });
  } catch (err) {
    console.error("resetPassword error:", err);
    return res
      .status(500)
      .json({ status: "error", message: "Could not reset password" });
  }
};
