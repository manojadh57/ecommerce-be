import Stripe from "stripe";
import Product from "../models/product/ProductSchema.js";

const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2024-06-20" });
};

export const createPaymentIntent = async (req, res) => {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return res
        .status(500)
        .json({ message: "Stripe not configured on server" });
    }

    const userId = req.user?._id?.toString();
    const { items = [], shipping = {}, currency = "aud" } = req.body || {};
    const shippingCost = Number(shipping?.amount || 0);

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "No items provided" });
    }

    // Load prices from DB (never trust client)
    const ids = items.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: ids } }).select(
      "_id price"
    );
    const priceMap = new Map(
      products.map((p) => [String(p._id), Number(p.price || 0)])
    );

    const subtotal = items.reduce((sum, it) => {
      const price = priceMap.get(String(it.productId)) || 0;
      const qty = Number(it.quantity || 1);
      return sum + price * qty;
    }, 0);

    const total = Math.max(0, subtotal + shippingCost);
    const amount = Math.round(total * 100); // cents

    const intent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        app: "ecommerce-mern",
        userId: userId || "",
        items: JSON.stringify(
          items.map(({ productId, quantity }) => ({ productId, quantity }))
        ),
        shippingMethod: shipping?.method || "",
        shippingCost: String(shippingCost),
      },
    });

    return res.json({ clientSecret: intent.client_secret, amount });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};
