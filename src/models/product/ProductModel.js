import ProductModel from "./ProductSchema.js";

export const fetchProducts = () => {
  return ProductModel.find().populate("category");
};

export const fetchProductById = (id) => {
  return ProductModel.findById(id).populate("category");
};
