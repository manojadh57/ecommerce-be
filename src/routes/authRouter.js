import express from "express";
import rateLimit from "express-rate-limit";
import {
  signup,
  verifyEmail,
  login,
  refreshAccess,
  requestPasswordReset,
  resetPassword,
} from "../controllers/authController.js";

const router = express.Router();

// Throttles (tweak as you like)
const limiterSignup = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

const limiterLogin = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 min
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

const limiterForgot = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

// Public auth routes
router.post("/signup", limiterSignup, signup);
router.get("/verify/:token", verifyEmail);
router.post("/login", limiterLogin, login);
router.post("/refresh-token", refreshAccess);
router.post("/forgot-password", limiterForgot, requestPasswordReset);
router.post("/reset-password", resetPassword);

export default router;
