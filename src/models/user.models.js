import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { JWT_EXPIRES_IN, JWT_SECRET } from "../config/env.config.js";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    emailVerificationToken: {
      type: String,
    },
    emailVerificationTokenExpiry: {
      type: Date,
    },

    refreshToken: {
      type: String,
    },
  },
  { timestamps: true },
);

// userSchema.index({ userName: 1 });

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
  return;
});

userSchema.methods.matchPassword = async function (userPassword) {
  const isMatch = await bcrypt.compare(userPassword, this.password);
  console.log("---", isMatch);
  return isMatch;
};
const options = {};

userSchema.methods.setAccessToken = async function (id) {
  const jwt_secret = jwt.sign({ _id: id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
  return jwt_secret;
};

const User = mongoose.model("User", userSchema);

export default User;
