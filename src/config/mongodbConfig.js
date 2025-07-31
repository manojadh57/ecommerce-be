import mongoose from "mongoose";
import { config } from "../config/config.js";

export const connectMongoDB = () => {
  return mongoose.connect(config.mongodb.url);
};

export default connectMongoDB;
