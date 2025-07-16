import UserModel from "./UserSchema.js";

//CREATE//
export const createNewUser = (userObj) => {
  return UserModel(userObj).save();
};

//get user by email//

export const getUserByEmail = (email) => {
  return UserModel.findOne({ email });
};

//get user by ID//
export const getUserByID = (id) => {
  return UserModel.findById(id).select("-password");
};

//update user
export const updateUser = async (filter = {}, obj = {}) => {
  return await UserModel.findOneAndUpdate(filter, obj, { new: true });
};
