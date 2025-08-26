import jwt from "jsonwebtoken";
import { insertToken } from "../models/session/SessionSchema.js";
import { updateUser } from "../models/user/UserModel.js";
import { config } from "../config/config.js";

export const signAccessJWT = async (
  payload = {},
  expiresIn = config.jwt.expireIn
) => {
  const token = jwt.sign(payload, config.jwt.secret, { expiresIn });

  await insertToken({ token });
  return token;
};

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (err) {
    return err.name === "TokenExpiredError" ? "jwt expired" : "invalid token";
  }
};

export const signRefreshJWT = async ({ email }) => {
  const refreshJWT = jwt.sign({ email }, config.jwt.refreshSecret, {
    expiresIn: "30d",
  });

  await updateUser({ email }, { refreshJWT });
  return refreshJWT;
};

export const verifyRefreshJWT = (token) => {
  try {
    console.log(token);
    return jwt.verify(token, config.jwt.refreshSecret);
  } catch {
    return "invalid token";
  }
};
