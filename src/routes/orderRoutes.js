import express from "express";
import mongoose from "mongoose";
import {
  placeOrder,
  getMyOrders,
  updateOrderStatus,
} from "../controllers/orderController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();


const isAdmin = (req, res, next) => {
  const role = req.user?.role;
  if (role === "admin" || req.user?.isAdmin === true) return next();
  return res.status(403).json({ status: "error", message: "Admin only" });
};

const ALLOWED_STATUSES = new Set([
  "pending",
  "shipped",
  "delivered",
  "cancelled",
]);
const validateUpdateStatus = (req, res, next) => {
  const { id } = req.params,
    { status } = req.body;
  if (!mongoose.isValidObjectId(id))
    return res
      .status(400)
      .json({ status: "error", message: "Invalid order id" });
  if (!ALLOWED_STATUSES.has(status))
    return res.status(400).json({ status: "error", message: "Invalid status" });
  next();
};

router.post("/", protect, placeOrder);
router.get("/", protect, getMyOrders);


router.put(
  "/:id/status",
  protect,
  isAdmin,
  validateUpdateStatus,
  updateOrderStatus
);

export default router;
