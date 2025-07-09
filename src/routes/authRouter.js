import { Router } from "express";
import {
  signup,
  verifyEmail,
  login,
  refreshAccess,
} from "../controllers/authController.js";

const router = Router();

router.post("/signup", signup);
router.get("/verify/:token", verifyEmail);
router.post("/login", login);
router.post("/refresh-token", refreshAccess);

export default router;
