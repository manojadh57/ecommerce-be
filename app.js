import "dotenv/config";
import express from "express";
import connectMongoDB from "./src/config/mongodbConfig.js";
import authRouter from "./src/routes/authRouter.js";

connectMongoDB();

const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) =>
  res.json({ status: "sucess", message: "API is running" })
);

app.use("/api/customer/v1/auth", authRouter);

export default app;
