import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["customer"],
      default: "customer",
    },
    fName: {
      type: String,
      required: true,
    },
    lName: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      unique: true,
      index: 1,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    refreshJWT: {
      type: String,
      default: "",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      required: true,
    },

    // 🔽 Reset password fields
    resetPasswordToken: {
      type: String,
      default: "",
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ resetPasswordToken: 1, resetPasswordExpires: 1 });

export default mongoose.model("User", userSchema);
