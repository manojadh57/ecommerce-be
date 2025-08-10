import {
  createNewUser,
  getUserByEmail,
  updateUser,
} from "../models/user/UserModel.js";
import { v4 as uuidv4 } from "uuid";
import {
  signAccessJWT,
  signRefreshJWT,
  verifyAccessToken,
  verifyRefreshJWT,
} from "../utils/jwtHelper.js";

import {
  passwordResetOTPSendEmail,
  sendVerificationEmail,
  userProfileUpdateNotificationEmail,
} from "../helpers/emailService.js";
import { hashPassword, comparePassword } from "../utils/bcrypt.js";
import {
  createNewSession,
  deleteSession,
  getSession,
} from "../models/session/SessionSchema.js";
import { token } from "morgan";
import { generateRandomOTP } from "../utils/randomeGenerator.js";

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

    //create a user using createNewUser model
    const user = await createNewUser({
      fName,
      lName,
      role,
      email,
      password: hashPassword(password),
      verificationToken,
    });

    // check if the user has the id and create the session
    if (user?._id) {
      const verificationToken = await signAccessJWT({ email }, "15m");
      const session = await createNewSession({
        token: verificationToken,
        association: user.email,
      });

      //check the session has id
      if (session?._id) {
        const url = `${process.env.ROOT_URL}/activate-user?sessionId=${session._id}&t=${verificationToken}`;
        console.log(url);

        await sendVerificationEmail({
          email: user.email,
          url,
          name: user.fName,
        });
        return res.status(201).json({
          status: "success",
          message: "Signup OK – verify e-mail",
          user: {
            id: user._id,
            fName: user.fName,
            lName: user.lName,
            email: user.email,
            role: user.role,
          },
        });
      }
    }
    return res.status(500).json({
      status: "error",
      message: "unable to sign in, please try again",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", message: err.message });
  }
};

//  VERIFY EMAIL
// export const verifyEmail = async (req, res) => {
//   try {
//     const { token } = req.params;
//     const { email } = verifyAccessToken(token);

//     const user = await getUserByEmail(email);
//     if (!user || user.isVerified) {
//       return res
//         .status(400)
//         .json({ status: "error", message: "Invalid or already verified" });
//     }

//     await updateUser({ email }, { isVerified: true, verificationToken: "" });

//     return res.json({
//       status: "success",
//       message: "Email verified successfully",
//     });
//   } catch (err) {
//     console.error("Email verification error:", err);
//     return res
//       .status(400)
//       .json({ status: "error", message: "Verification failed" });
//   }
// };

export const verifyEmail = async (req, res) => {
  try {
    const { sessionId, t: token } = req.query;

    if (!sessionId || !token) {
      return res.status(400).json({
        status: "error",
        message: "Missing session or token",
      });
    }

    // grabbing the session from the db

    const session = await getSession({ _id: sessionId });

    if (!session || session.token !== token) {
      return res.status(400).json({
        status: "error",
        message: "Invalid or expired session",
      });
    }
    //verify the token and deode email
    console.log("Verifying token:", token);

    const decoded = verifyAccessToken(token);
    if (typeof decoded !== "object" || !decoded.email) {
      return res.status(400).json({
        status: "error",
        message: "Invalid or expired token",
      });
    }

    // Find the user by decoded email
    const user = await getUserByEmail(decoded.email);
    if (!user || user.isVerified) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid or already verified" });
    }

    //updating the user verification status
    await updateUser(
      { email: decoded.email },
      { isVerified: true, verificationToken: "" }
    );

    //deleting the session
    await deleteSession({ _id: sessionId });

    //reponse
    return res.status(200).json({
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

//generate otp
export const generateOTP = async (req, res, next) => {
  try {
    //get user by. email

    const { email } = req.body;
    console.log("REQ BODY:", req.body);

    const user = typeof email === "string" ? await getUserByEmail(email) : null;

    if (user?._id) {
      //generate the otp
      const otp = generateRandomOTP();
      console.log(otp);

      //store the otp in session table
      const session = await createNewSession({
        token: otp,
        association: email,
        expire: new Date(Date.now() + 1000 * 60 * 5), //expires in 5 min
      });

      if (session?._id) {
        console.log(session);

        //send otp tp users email
        const info = await passwordResetOTPSendEmail({
          email,
          name: user.fName,
          otp,
        });
        console.log(info);

        return res.status(200).json({
          status: "success",
          message: "OTP sent to your email",
        });
      }
    }

    return res.status(500).json({
      status: "error",
      message: "Unable to generate OTP, please try again",
    });
  } catch (error) {
    next(error);
  }
};

//reset the password
export const resetNewPass = async (req, res, next) => {
  try {
    //get user email , pass and otp
    console.log(req.body);
    const { email, password, otp } = req.body;

    //graab the session
    const session = await getSession({
      token: otp,
      association: email,
    });

    if (session?._id) {
      //encrypt the password
      const hashPass = hashPassword(password);

      //update the user table

      const user = await updateUser({ email }, { password: hashPass });
      if (user?._id) {
        //send email notification as well
        userProfileUpdateNotificationEmail({ email, name: user.fName });

        return res.status(200).json({
          status: "success",
          message: "Your password has been updated, you can log in now.",
        });
      }
    }

    return res.status(400).json({
      status: "error",
      message: "Invalid data or token expired",
    });
  } catch (error) {
    next(error);
  }
};
