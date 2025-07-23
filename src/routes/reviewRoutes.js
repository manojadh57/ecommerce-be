import express from "express";
import {
  submitReview,
  getProductReviews,
} from "../controllers/reviewController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, submitReview);

router.get("/:productId", getProductReviews);

export default router;
