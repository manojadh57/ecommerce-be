// models/order/OrderSchema.js
import mongoose from "mongoose";

const AddressSchema = new mongoose.Schema(
  {
    name: String,
    phone: String,
    line1: { type: String, required: true },
    line2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
    email: String, // optional but handy
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    products: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: Number,
      },
    ],
    status: {
      type: String,
      enum: ["pending", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    totalAmount: Number, // still cents
    address: { type: AddressSchema, default: null }, // 👈 must exist
    shippingMethod: {
      type: String,
      enum: ["standard", "express"],
      default: "standard",
    }, // 👈 must exist
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
