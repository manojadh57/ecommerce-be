import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      require: true,
    },
    association: {
      type: String,
      default: "",
    },
       expire: {
        type: Date,
        required: true,
        default: new Date(Date.now() + 86400000), //1000*60*60*60 1
        expires: 0,
    },
  },
  {
    timestamps: true,
  }
);

///we did schema and model on the same code//

const SessionSchema = mongoose.model("Session", sessionSchema);

export const insertToken = (obj) => {
  return SessionSchema(obj).save();
}; 

//creating a session
export const createNewSession = (obj) => {
  return SessionSchema(obj).save();
};

//
export const getSession=(filter)=> {
  return SessionSchema.findOne(filter);
};

//deleteing
export const deleteSession = (filter)=> {
  return SessionSchema.findOneAndDelete(filter);
}
export const findToken = (token) => {
  return sessionSchema.findOne({ token });
};
