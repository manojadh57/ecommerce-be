import "dotenv/config";
import express from "express";
import connectDB from "./src/config/mongodbConfig.js";

connectDB();

const app = express();

app.get("/", (req, res) =>
  res.json({ status: "sucess", message: "API is running" })
);

export default app;
