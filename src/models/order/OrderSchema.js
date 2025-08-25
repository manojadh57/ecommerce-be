import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        quantity: Number,
      },
    ],
    trackingId: {
      type: String,
      unique: true,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "out for delivery", "delivered", "cancelled"],
      default: "pending",
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: ["pending", "processing", "shipped", "out for delivery", "delivered", "cancelled"],
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    totalAmount: Number,
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
