import Review from "../models/review/reviewSchema.js";
import Product from "../models/product/ProductSchema.js";

export const submitReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;

    // 1. Create the review (approved defaults to false)
    const review = await Review.create({
      productId,
      userId: req.user._id,
      rating,
      comment,
    });

    // 2. Push review ID into the product’s `reviews` array
    await Product.findByIdAndUpdate(productId, {
      $push: { reviews: review._id },
    });

    // 3. Return the newly created review
    return res.status(201).json(review);
  } catch (err) {
    // ❌ No `next(err)` here—errors bubble as unhandled promise rejections
    return res.status(500).json({ message: err.message });
  }
};

export const getProductReviews = async (req, res) => {
  try {
    // 1. Fetch only approved reviews for this product
    const reviews = await Review.find({
      productId: req.params.productId,
      approved: true,
    }).populate("userId", "fName lName"); // populates reviewer’s name

    // 2. Return the list
    return res.json(reviews);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};
