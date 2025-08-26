import Review from "../models/review/reviewSchema.js";
import Product from "../models/product/ProductSchema.js";

// POST /api/customer/v1/reviews
export const submitReview = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { productId, rating, comment = "" } = req.body;

    if (!userId) return res.status(401).json({ message: "login required" });
    if (!productId || !rating) {
      return res.status(400).json({ message: "productId and rating required" });
    }
    const r = Number(rating);
    if (r < 1 || r > 5)
      return res.status(400).json({ message: "rating must be 1..5" });

    // one review per user per product (update if exists)
    let review = await Review.findOne({ productId, userId });

    if (review) {
      review.rating = r;
      review.comment = String(comment).trim();
      review.approved = false;
      await review.save();
      return res.status(200).json(review);
    }

    // create new review
    review = await Review.create({
      productId,
      userId,
      rating: r,
      comment: String(comment).trim(),
      approved: false,
    });

    // keep product.reviews in sync (no duplicates)
    await Product.findByIdAndUpdate(productId, {
      $addToSet: { reviews: review._id },
    });

    return res.status(201).json(review);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// GET /api/customer/v1/reviews/:productId
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    const reviews = await Review.find({ productId, approved: true })
      .populate("userId", "fName lName name email")
      .sort({ createdAt: -1 });

    const count = reviews.length;
    const average = count
      ? +(reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / count).toFixed(
          2
        )
      : 0;

    return res.json({ reviews, average, count });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
