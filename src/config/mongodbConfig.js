import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("mongoDB connected");
  } catch (err) {
    console.error("mongoDB not connected", err.message);
    process.exit(1);
  }
};

export default connectDB;
