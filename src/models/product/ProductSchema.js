import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: String,
    description: String,
    price: Number,
    stock: Number,
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
    },
    images: [String],
    ratings: [Number],
    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
