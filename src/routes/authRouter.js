import { Router } from "express";
import {
  signup,
  verifyEmail,
  login,
  refreshAccess,
  generateOTP,
  resetNewPass,
} from "../controllers/authController.js";

import protect from "../middleware/authMiddleware.js";

const router = Router();

router.post("/signup", signup);
router.get("/activate-user", verifyEmail);
router.post("/login", login);
router.post("/refresh-token", refreshAccess);

router.post("/otp", generateOTP);

router.post("/reset-password", resetNewPass);

//making a user profile//
router.get("/profile", protect, async (req, res) => {
  const user = await getUserByEmail(req.user.email);
  res.json({ status: "success", user });
});

export default router;
