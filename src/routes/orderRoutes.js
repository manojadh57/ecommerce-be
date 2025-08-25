import express from "express";
import { placeOrder, getMyOrders, getOrderByTrackingId } from "../controllers/orderController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.post("/", protect, placeOrder);
router.get("/", protect, getMyOrders);
//  Public tracking route
router.get("/track/:trackingId", getOrderByTrackingId);

export default router;
