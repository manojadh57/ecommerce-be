import express from "express";
import {
  submitReview,
  getProductReviews,
} from "../controllers/reviewController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create or update a review (must be logged in)
router.post("/", protect, submitReview);

// Get approved reviews for a product (public)
router.get("/:productId", getProductReviews);

export default router;
