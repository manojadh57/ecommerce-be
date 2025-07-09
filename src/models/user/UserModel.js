import UserSchema from "./UserSchema.js";

//CREATE//
export const createNewUser = (userObj) => {
  return UserSchema(userObj).save();
};

//get user by email//

export const getUserByEmail = (email) => {
  return UserSchema.findOne({ email });
};

//get user by ID//
export const getUserByID = (id) => {
  return UserSchema.findById(id);
};

//update user
export const updateUser = async (filter = {}, obj = {}) => {
  return await UserSchema.findOneAndUpdate(filter, obj, { new: true });
};
