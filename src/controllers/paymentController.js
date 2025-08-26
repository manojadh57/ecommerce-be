import Stripe from "stripe";
import mongoose from "mongoose";
import Product from "../models/product/ProductSchema.js";
import Order from "../models/order/OrderSchema.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const CURRENCY = (process.env.STRIPE_CURRENCY || "AUD").toLowerCase();
const toCents = (n) => Math.round(Number(n || 0) * 100);

const isTxnNotSupported = (err) =>
  /Transaction numbers are only allowed on a replica set member or mongos/i.test(
    String(err?.message || err)
  );

//  server-side pricing (prevents tampering)
async function priceCartCents(products, shippingMethod) {
  if (!Array.isArray(products) || products.length === 0) {
    throw new Error("No products");
  }

  const ids = products.map((p) => p.productId);
  const docs = await Product.find({ _id: { $in: ids } })
    .select("_id name price stock")
    .lean();

  const map = new Map(docs.map((d) => [String(d._id), d]));
  let subtotalCents = 0;

  for (const line of products) {
    const doc = map.get(String(line.productId));
    if (!doc) throw new Error("Product not found");
    const qty = Number(line.quantity);
    if (!Number.isInteger(qty) || qty <= 0) throw new Error("Bad quantity");
    if (doc.stock < qty) throw new Error(`Insufficient stock for ${doc.name}`);
    subtotalCents += toCents(doc.price) * qty;
  }

  const shipCents = shippingMethod === "express" ? 1295 : 695;
  return { subtotalCents, shipCents, totalCents: subtotalCents + shipCents };
}

//  POST /api/customer/v1/payments/create-intent
export const createPaymentIntent = async (req, res) => {
  try {
    const { products = [], shippingMethod = "standard" } = req.body;
    const { totalCents } = await priceCartCents(products, shippingMethod);

    const intent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: CURRENCY,
      automatic_payment_methods: { enabled: true },
      metadata: {
        shippingMethod,
        userId: String(req.user?._id || req.user?.id || ""),
        project: "college-demo",
      },
    });

    res.json({
      status: "success",
      clientSecret: intent.client_secret,
      intentId: intent.id,
      amount: totalCents,
    });
  } catch (e) {
    res
      .status(400)
      .json({ status: "error", message: e.message || "Payment init failed" });
  }
};

// POST /api/customer/v1/payments/confirm-order
export const confirmPaidOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId)
      return res.status(401).json({ status: "error", message: "Unauthorized" });

    const {
      intentId,
      products = [],
      shippingMethod = "standard",
      address,
      notes,
      customer,
    } = req.body;

    if (!intentId)
      return res
        .status(400)
        .json({ status: "error", message: "Missing intentId" });

    // 1) Recompute amount on server
    const { subtotalCents, shipCents, totalCents } = await priceCartCents(
      products,
      shippingMethod
    );

    // 2) Verify with Stripe
    const intent = await stripe.paymentIntents.retrieve(intentId);
    if (!intent || intent.status !== "succeeded") {
      return res
        .status(400)
        .json({ status: "error", message: "Payment not completed" });
    }
    if (
      Number(intent.amount) !== Number(totalCents) ||
      intent.currency !== CURRENCY
    ) {
      return res
        .status(400)
        .json({ status: "error", message: "Amount/currency mismatch" });
    }

    // 3) Decrement stock + create order
    let order;
    try {
      // Try transactional path first (replica set / mongos)
      session.startTransaction();

      for (const item of products) {
        const qty = Number(item.quantity);
        const upd = await Product.updateOne(
          { _id: item.productId, stock: { $gte: qty } },
          { $inc: { stock: -qty } },
          { session }
        );
        if (upd.modifiedCount !== 1) throw new Error("CONFLICT_STOCK");
      }

      const created = await Order.create(
        [
          {
            userId,
            products: products.map((p) => ({
              productId: p.productId,
              quantity: Number(p.quantity),
            })),
            totalAmount: totalCents, // cents
            // enum-safe workflow state; payment success is tracked below
            status: "pending",
            address: address || null,
            notes: notes || "",
            shippingMethod,
            payment: {
              provider: "stripe",
              intentId,
              amount: totalCents,
              currency: CURRENCY.toUpperCase(),
              status: "succeeded",
              subtotal: subtotalCents,
              shipping: shipCents,
            },
            customer: customer || null,
          },
        ],
        { session }
      );
      order = created[0];

      await session.commitTransaction();
      session.endSession();
    } catch (txErr) {
      // Always end the session cleanly
      try {
        await session.abortTransaction();
      } catch {}
      session.endSession();

      // Stock changed mid-flight
      if (txErr.message === "CONFLICT_STOCK") {
        return res.status(409).json({
          status: "error",
          message:
            "Stock changed while paying. You were not charged again — please try again.",
        });
      }

      // 3b) Standalone Mongo fallback (no transactions)
      if (isTxnNotSupported(txErr)) {
        const decremented = [];
        try {
          for (const item of products) {
            const qty = Number(item.quantity);
            const upd = await Product.updateOne(
              { _id: item.productId, stock: { $gte: qty } },
              { $inc: { stock: -qty } }
            );
            if (upd.modifiedCount !== 1) {
              // rollback any prior decrements
              for (const d of decremented) {
                await Product.updateOne(
                  { _id: d.productId },
                  { $inc: { stock: d.qty } }
                );
              }
              return res.status(409).json({
                status: "error",
                message:
                  "Stock changed while paying. You were not charged again — please try again.",
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
            totalAmount: totalCents, // cents
            // enum-safe workflow state
            status: "pending",
            address: address || null,
            notes: notes || "",
            shippingMethod,
            payment: {
              provider: "stripe",
              intentId,
              amount: totalCents,
              currency: CURRENCY.toUpperCase(),
              status: "succeeded",
              subtotal: subtotalCents,
              shipping: shipCents,
            },
            customer: customer || null,
          });
        } catch (fallbackErr) {
          // best-effort rollback if order creation failed
          for (const d of decremented) {
            await Product.updateOne(
              { _id: d.productId },
              { $inc: { stock: d.qty } }
            );
          }
          return res.status(400).json({
            status: "error",
            message: fallbackErr.message || "Could not finalize order",
          });
        }
      } else {
        // Unknown error from transactional path
        return res.status(400).json({
          status: "error",
          message: txErr.message || "Could not finalize order",
        });
      }
    }

    // 4) Populate & return
    const populated = await Order.findById(order._id)
      .populate("products.productId", "name price images")
      .lean();

    return res.status(201).json({ status: "success", order: populated });
  } catch (e) {
    return res.status(400).json({
      status: "error",
      message: e.message || "Could not finalize order",
    });
  }
};
