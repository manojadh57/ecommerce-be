import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createPaymentIntent,
  confirmPaidOrder,
} from "../controllers/paymentController.js";

const router = express.Router();

// customer must be logged in
router.post("/create-intent", protect, createPaymentIntent);
router.post("/confirm-order", protect, confirmPaidOrder);

export default router;
