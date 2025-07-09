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

//SIGNUP//

export const signup = async (req, res) => {
  try {
    const { fName, lName, email, password, role = "student" } = req.body;

    // basic field check
    if (!fName || !lName || !email || !password) {
      return res
        .status(400)
        .json({ status: "error", message: "All fields are required" });
    }

    // email uniqueness
    if (await getUserByEmail(email)) {
      return res
        .status(400)
        .json({ status: "error", message: "Email already registered" });
    }

    // create verification token (15 min)
    const verificationToken = await signAccessJWT({ email }, "15m");

    // persist user
    await createNewUser({
      fName,
      lName,
      role,
      email,
      password: hashPassword(password),
      verificationToken,
    });

    // send verification email
    await sendVerificationEmail(email, verificationToken);

    return res
      .status(201)
      .json({ status: "success", message: "Signup OK – verify e‑mail" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", message: err.message });
  }
};

//VERIFY EMAIL//
export const verifyEmail = async (req, res) => {
  const token = req.params.token;
  const user = await Customer.findOne({ verificationToken: token });

  if (!user) {
    return res
      .status(400)
      .json({ status: "error", message: "Invalid or expired token" });
  }

  user.isVerified = true; // ✅ This line
  user.verificationToken = null; // ✅ Clears token
  await user.save(); // ✅ Saves update

  res
    .status(200)
    .json({ status: "success", message: "Email verified successfully" });
};
//LOGIN//
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email?.includes("@") || !password) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid login details" });
    }

    const user = await getUserByEmail(email);

    console.log(user);

    if (!user || !user.verified) {
      return res
        .status(401)
        .json({ status: "error", message: "Account inactive / not verified" });
    }

    const pwMatch = comparePassword(password, user.password);
    if (!pwMatch) {
      return res
        .status(401)
        .json({ status: "error", message: "Invalid login details" });
    }

    const accessJWT = signAccessJWT({ email });
    const refreshJWT = await signRefreshJWT({ email });

    res.json({
      status: "success",
      message: "user authenticated",
      tokens: { accessJWT, refreshJWT },
    });
  } catch (err) {
    next(err);
  }
};

// refresh JWT//
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

    const newAccess = signAccessJWT({ email: decoded.email });
    res.json({ status: "success", accessJWT: newAccess });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
