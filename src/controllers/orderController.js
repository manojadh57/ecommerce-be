import { orderPlacedNotificationEmail } from "../helpers/emailService.js";
import Order from "../models/order/OrderSchema.js";
import { getUserByEmail } from "../models/user/UserModel.js";

export const placeOrder = async (req, res) => {
  try {
    const { products, totalAmount } = req.body;
    const userId = req.user?.id;
    const email = req.user?.email;

    // Basic validation
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!products || products.length === 0)
      return res.status(400).json({ message: "Cart cannot be empty" });
    if (!totalAmount || totalAmount <= 0)
      return res.status(400).json({ message: "Invalid total amount" });

    // Create order with tracking ID and initial status history
    const newOrder = new Order({
      userId,
      products,
      totalAmount,
      status: "pending",
    });

    const trackingId = newOrder._id.toString().slice(-6).toUpperCase();
    newOrder.trackingId = trackingId;
    newOrder.statusHistory = [{ status: "pending", updatedAt: new Date() }];

    await newOrder.save();

    // Get user data
    const user = await getUserByEmail(email);

    // Send confirmation email
    if (user?.email) {
      try {
        await orderPlacedNotificationEmail({
          email: user.email,
          name: user.fName || "Customer",
          orderId: trackingId,
          trackingLink: `${process.env.FRONTEND_URL}/track-order/${trackingId}`,
        });
      } catch (err) {
        console.error("Failed to send email:", err.message);
      }
    }

    return res
      .status(201)
      .json({ message: "Order placed successfully", order: newOrder });

  } catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: error.message });
  }
};


  // controllers/orderController.js

export const getOrderByTrackingId = async (req, res) => {
  try {
    const { trackingId } = req.params;

    const order = await Order.findOne({ trackingId });

    if (!order) {
      return res.status(404).json({ status: "error", message: "Order not found" });
    }

    res.json({
      status: "success",
      orderId: order.trackingId,
      status: order.status,
      totalAmount: order.totalAmount,
      placedAt: order.createdAt,
      statusHistory: order.statusHistory,
    });
  } catch (error) {
    console.error("Tracking error:", error.message);
    res.status(500).json({ status: "error", message: "Server error" });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).populate(
      "products.productId"
    );
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
