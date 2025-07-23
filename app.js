import "dotenv/config";
import express from "express";
import connectMongoDB from "./src/config/mongodbConfig.js";
import authRouter from "./src/routes/authRouter.js";
import productRoutes from "./src/routes/productRoutes.js";
import categoryRoutes from "./src/routes/categoryRoutes.js";
import orderRoutes from "./src/routes/orderRoutes.js";
import reviewRoutes from "./src/routes/reviewRoutes.js";
import cors from "cors";

const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

///mongoDB connection/
connectMongoDB();

app.get("/", (req, res) =>
  res.json({ status: "sucess", message: "API is running" })
);

app.use("/assets", express.static("assets"));

//authRoutes//

app.use("/api/customer/v1/auth", authRouter);
//productRoutes//

app.use("/api/customer/v1/products", productRoutes);

//Category routes//

app.use("/api/customer/v1/categories", categoryRoutes);

//order Routes//

app.use("/api/customer/v1/orders", orderRoutes);

//review Routers//
app.use("/api/customer/v1/reviews", reviewRoutes);

export default app;
