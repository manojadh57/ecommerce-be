import mongoose from "mongoose";
import Order from "../models/order/OrderSchema.js";
import Product from "../models/product/ProductSchema.js";
import { sendOrderStatusEmail } from "../helpers/emailHelper.js";

const PRICE_IS_DOLLARS = true;
const toCents = (n) => Math.round(Number(n) * 100);

// --- NEW: normalize what the checkout sends into a stable shape ---
const normalizeAddress = (a = {}, fallbackName = "") => ({
  // name: prefer explicit name, else compose first/last, else fallback from user
  name:
    a.name || `${a.firstName || ""} ${a.lastName || ""}`.trim() || fallbackName,
  phone: a.phone || "",
  line1: a.line1 || a.address1 || a.street || "",
  line2: a.line2 || a.address2 || "",
  city: a.city || "",
  state: a.state || a.region || "",
  postalCode: a.postalCode || a.postcode || a.zip || "",
  country: a.country || "",
  // keep email if FE attached it (handy for guests)
  email: a.email || "",
});

const validateProductsPayload = (products) => {
  if (!Array.isArray(products) || products.length === 0) {
    return "Products array is required";
  }
  for (const item of products) {
    if (!item?.productId) return "Each item must include productId";
    const qty = Number(item.quantity);
    if (!Number.isInteger(qty) || qty <= 0)
      return "Quantity must be a positive integer";
  }
  return null;
};

/**
 * POST /orders
 * Creates an order for the authenticated user.
 * - Validates payload
 * - Verifies stock
 * - Decrements stock atomically in a transaction when available
 * - Computes total on the server (ignores client total) + shipping fee
 * - Saves normalized address snapshot + shippingMethod
 * - Sends "placed" email AFTER commit (best-effort)
 */
export const placeOrder = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { products, address, notes, shippingMethod } = req.body;

    const userId = req.user?.id || req.user?._id;
    const userEmail = req.user?.email;
    const fallbackName =
      `${req.user?.fName || ""} ${req.user?.lName || ""}`.trim() ||
      req.user?.name ||
      "";

    const vErr = validateProductsPayload(products);
    if (vErr) return res.status(400).json({ status: "error", message: vErr });
    if (!userId)
      return res.status(401).json({ status: "error", message: "Unauthorized" });

    const ids = products.map((p) => p.productId);
    const productDocs = await Product.find({ _id: { $in: ids } })
      .select("_id name price stock")
      .lean();

    const map = new Map(productDocs.map((p) => [String(p._id), p]));

    let totalCents = 0;
    for (const item of products) {
      const doc = map.get(String(item.productId));
      if (!doc) {
        return res
          .status(404)
          .json({ status: "error", message: "One or more products not found" });
      }
      const qty = Number(item.quantity);
      if (doc.stock < qty) {
        return res.status(400).json({
          status: "error",
          message: `Insufficient stock for ${doc.name}`,
        });
      }
      const unit = PRICE_IS_DOLLARS ? toCents(doc.price) : Number(doc.price);
      totalCents += unit * qty;
    }

    // --- NEW: add shipping fee based on method (still cents) ---
    const method = shippingMethod === "express" ? "express" : "standard";
    const shippingFeeCents = method === "express" ? 1295 : 695;
    totalCents += shippingFeeCents;

    // --- NEW: normalize address snapshot (can include email/phone) ---
    const normalizedAddress = address
      ? normalizeAddress(address, fallbackName)
      : null;

    // Try transactional path first
    let order;
    try {
      session.startTransaction();

      for (const item of products) {
        const qty = Number(item.quantity);
        const upd = await Product.updateOne(
          { _id: item.productId, stock: { $gte: qty } },
          { $inc: { stock: -qty } },
          { session }
        );
        if (upd.modifiedCount !== 1) {
          throw new Error("CONFLICT_STOCK");
        }
      }

      const created = await Order.create(
        [
          {
            userId,
            products: products.map((p) => ({
              productId: p.productId,
              quantity: Number(p.quantity),
            })),
            totalAmount: totalCents,
            status: "pending",
            address: normalizedAddress, // <— save snapshot
            notes: notes || "",
            shippingMethod: method, // <— save method
          },
        ],
        { session }
      );
      order = created[0];

      await session.commitTransaction();
      session.endSession();
    } catch (txErr) {
      // If transaction not supported or conflict, fallback to non-transaction with compensation
      try {
        await session.abortTransaction();
      } catch {}
      session.endSession();

      if (txErr.message === "CONFLICT_STOCK") {
        return res.status(409).json({
          status: "error",
          message: "Stock changed. Please try again.",
        });
      }

      if (/Transaction numbers are only allowed/.test(String(txErr))) {
        // Fallback: best-effort compensation
        const decremented = [];
        try {
          for (const item of products) {
            const qty = Number(item.quantity);
            const upd = await Product.updateOne(
              { _id: item.productId, stock: { $gte: qty } },
              { $inc: { stock: -qty } }
            );
            if (upd.modifiedCount !== 1) {
              // rollback previous decrements
              for (const d of decremented) {
                await Product.updateOne(
                  { _id: d.productId },
                  { $inc: { stock: d.qty } }
                );
              }
              return res.status(409).json({
                status: "error",
                message: "Stock changed. Please try again.",
              });
            }
            decremented.push({ productId: item.productId, qty });
          }

          order = await Order.create({
            userId,
            products: products.map((p) => ({
              productId: p.productId,
              quantity: Number(p.quantity),
            })),
            totalAmount: totalCents,
            status: "pending",
            address: normalizedAddress, // <— save snapshot
            notes: notes || "",
            shippingMethod: method, // <— save method
          });
        } catch (fallbackErr) {
          // Roll back any decrements if order creation fails
          for (const d of decremented) {
            await Product.updateOne(
              { _id: d.productId },
              { $inc: { stock: d.qty } }
            );
          }
          throw fallbackErr;
        }
      } else {
        throw txErr;
      }
    }

    // Email (best-effort) — prefer logged-in email, else form email, else address email
    const toEmail =
      userEmail || req.body?.email || normalizedAddress?.email || null;

    try {
      if (toEmail) {
        await sendOrderStatusEmail({ to: toEmail, status: "pending", order });
      }
    } catch (mailErr) {
      console.error("Order email failed:", mailErr?.message || mailErr);
    }

    const populated = await Order.findById(order._id)
      .populate("products.productId", "name price images")
      .lean();

    return res.status(201).json({
      status: "success",
      message: "Order placed successfully",
      order: populated,
    });
  } catch (error) {
    console.error("placeOrder error:", error);
    return res
      .status(500)
      .json({ status: "error", message: "Could not place order" });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId)
      return res.status(401).json({ status: "error", message: "Unauthorized" });

    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .populate("products.productId", "name price images")
      .lean();

    return res.json({ status: "success", orders });
  } catch (error) {
    console.error("getMyOrders error:", error);
    return res
      .status(500)
      .json({ status: "error", message: "Could not fetch orders" });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'pending'|'shipped'|'delivered'|'cancelled'
    const allowed = new Set(["pending", "shipped", "delivered", "cancelled"]);
    if (!allowed.has(status)) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid status" });
    }

    const order = await Order.findByIdAndUpdate(id, { status }, { new: true })
      .populate("userId", "email")
      .lean();

    if (!order)
      return res
        .status(404)
        .json({ status: "error", message: "Order not found" });

    const to = order.userId?.email || order?.address?.email || null;

    if (to) {
      sendOrderStatusEmail({ to, status, order }).catch((e) =>
        console.error("Status email failed:", e?.message || e)
      );
    }

    return res.json({ status: "success", order });
  } catch (error) {
    console.error("updateOrderStatus error:", error);
    return res
      .status(500)
      .json({ status: "error", message: "Could not update order status" });
  }
};
