import {
  fetchProductById,
  fetchProducts,
} from "../models/product/ProductModel.js";

export const getAllProducts = async (req, res) => {
  try {
    const products = await fetchProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ messsage: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    let id = req.params.id;
    const product = await fetchProductById(id);
    if (!product) return res.status(404).json({ message: "product not found" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
