import { Router } from "express";
import {
  signup,
  verifyEmail,
  login,
  refreshAccess,
} from "../controllers/authController.js";

import protect from "../middleware/authMiddleware.js";

const router = Router();

router.post("/signup", signup);
router.get("/verify/:token", verifyEmail);
router.post("/login", login);
router.post("/refresh-token", refreshAccess);

//making a user profile//
router.get("/profile", protect, async (req, res) => {
  const user = await getUserByEmail(req.user.email);
  res.json({ status: "success", user });
});

export default router;
