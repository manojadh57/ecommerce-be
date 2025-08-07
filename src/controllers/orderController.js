import Order from "../models/order/OrderSchema.js";

export const placeOrder = async (req, res) => {
  try {
    console.log("TEST");
    const { products, totalAmount } = req.body;
    const userId = req.user.id;

    const newOrder = new Order({
      userId,
      products,
      totalAmount,
      status: "pending",
    });

    await newOrder.save();
    return res
      .status(201)
      .json({ message: "Order placed successfully", order: newOrder });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: error.message });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).populate(
      "products.productId"
    );
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
