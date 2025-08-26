import ProductModel from "./ProductSchema.js";

export const fetchProducts = (search = "", limit, includeRatings, category) => {
  const filter = {};

  // text search
  if (search && search.trim().length > 0) {
    filter.$or = [
      { name: { $regex: search.trim(), $options: "i" } },
      { description: { $regex: search.trim(), $options: "i" } },
    ];
  }

  // category filter (single id or comma list)
  if (category) {
    const list = Array.isArray(category)
      ? category
      : String(category)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
    if (list.length) filter.category = { $in: list };
  }

  const q = ProductModel.find(filter).populate("category");
  if (limit !== undefined) q.limit(Number(limit));

  return q;
};

export const fetchProductById = (id) =>
  ProductModel.findById(id).populate("category");
