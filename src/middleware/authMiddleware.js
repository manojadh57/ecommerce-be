import jwt from "jsonwebtoken";
import { getUserByEmail, getUserByID } from "../models/user/UserModel.js";
import { config } from "../config/config.js";

export const protect = async (req, res, next) => {
  try {
    let token;

    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer")) {
      token = authHeader.split(" ")[1];

      const decoded = jwt.verify(token, config.jwt.secret);

      const user = await getUserByEmail(decoded.email);

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      req.user = user;
      next();
    } else {
      return res.status(401).json({ message: "Not authorized, no token" });
    }
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Not authorized, token failed", error: error.message });
  }
};

export default protect;
