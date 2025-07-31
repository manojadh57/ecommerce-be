import {
  createNewUser,
  getUserByEmail,
  updateUser,
} from "../models/user/UserModel.js";

import {
  signAccessJWT,
  signRefreshJWT,
  verifyAccessToken,
  verifyRefreshJWT,
} from "../utils/jwtHelper.js";

import { sendVerificationEmail } from "../helpers/emailHelper.js";
import { hashPassword, comparePassword } from "../utils/bcrypt.js";

// SIGNUP
export const signup = async (req, res) => {
  try {
    const { fName, lName, email, password, role = "customer" } = req.body;

    if (!fName || !lName || !email || !password) {
      return res
        .status(400)
        .json({ status: "error", message: "All fields are required" });
    }

    if (await getUserByEmail(email)) {
      return res
        .status(400)
        .json({ status: "error", message: "Email already registered" });
    }

    const verificationToken = await signAccessJWT({ email }, "15m");

    // send verification email

    await createNewUser({
      fName,
      lName,
      role,
      email,
      password: hashPassword(password),
      verificationToken,
    });

    await sendVerificationEmail(email, verificationToken);

    return res
      .status(201)
      .json({ status: "success", message: "Signup OK – verify e-mail" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", message: err.message });
  }
};

//  VERIFY EMAIL
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const { email } = verifyAccessToken(token);

    const user = await getUserByEmail(email);
    if (!user || user.isVerified) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid or already verified" });
    }

    await updateUser({ email }, { isVerified: true, verificationToken: "" });

    return res.json({
      status: "success",
      message: "Email verified successfully",
    });
  } catch (err) {
    console.error("Email verification error:", err);
    return res
      .status(400)
      .json({ status: "error", message: "Verification failed" });
  }
};

//  LOGIN
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email?.includes("@") || !password) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid login details" });
    }

    const user = await getUserByEmail(email);
    if (!user || !user.isVerified) {
      return res.status(401).json({
        status: "error",
        message: "Account inactive or not verified",
      });
    }

    const pwMatch = comparePassword(password, user.password);
    if (!pwMatch) {
      return res
        .status(401)
        .json({ status: "error", message: "Invalid login details" });
    }

    const accessJWT = await signAccessJWT({ email });
    const refreshJWT = await signRefreshJWT({ email });

    await updateUser({ email }, { refreshJWT }); // save token to DB

    user.password = "";
    return res.json({
      status: "success",
      message: "User authenticated",
      tokens: { accessJWT, refreshJWT },
      user,
    });
  } catch (err) {
    next(err);
  }
};

//  REFRESH TOKEN
export const refreshAccess = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res
        .status(400)
        .json({ status: "error", message: "refreshToken missing" });
    }

    const decoded = verifyRefreshJWT(refreshToken);
    const user = await getUserByEmail(decoded.email);

    if (!user || user.refreshJWT !== refreshToken) {
      return res
        .status(401)
        .json({ status: "error", message: "Invalid refresh token" });
    }

    const newAccess = await signAccessJWT({ email: decoded.email });
    const newRefresh = signAccessJWT({ email: decoded.email });

    return res.json({ status: "success", accessJWT: newAccess });
  } catch (err) {
    return res.status(500).json({ status: "error", message: err.message });
  }
};
