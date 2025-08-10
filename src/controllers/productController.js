import {
  fetchProductById,
  fetchProducts,
} from "../models/product/ProductModel.js";

export const getAllProducts = async (req, res) => {
  try {
    const { q = "", limit, includeRatings, category } = req.query;

    const limNum = Number(limit);
    const useLimit = Number.isFinite(limNum) ? limNum : undefined;

    const withRatings =
      includeRatings === "1" ||
      includeRatings === "true" ||
      includeRatings === 1 ||
      includeRatings === true;

    const products = await fetchProducts(q, useLimit, withRatings, category);
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const id = req.params.id;
    const product = await fetchProductById(id);
    if (!product) return res.status(404).json({ message: "product not found" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
