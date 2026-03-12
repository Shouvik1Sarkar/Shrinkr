import User from "../models/user.models.js";
import ApiError from "../utils/ApiError.utils.js";
import ApiResponse from "../utils/ApiResponse.utils.js";
import asyncHandler from "../utils/asyncHandler.utils.js";
import cookieParser from "cookie-parser";
import crypto from "crypto";

import { mail } from "../utils/email.utils.js";

export const createUser = asyncHandler(async (req, res, next) => {
  const { fullName, lastName, userName, password, email } = req.body;

  if (
    [fullName, lastName, userName, password, email].some(
      (e) => e == undefined || e.trim() == "",
    )
  ) {
    throw new ApiError(401, "All credentials are required");
  }

  const existedUser = await User.findOne({
    $or: [{ email: email }, { userName: userName }],
  });

  if (existedUser) {
    throw new ApiError(401, "User already exists. LogIn.");
  }

  const user = await User.create({
    fullName,
    lastName,
    userName,
    password,
    email,
  });

  if (!user) {
    throw new ApiError(401, "User not created");
  }
  const { num, encryptedOTP } = user.generateOTP();

  // mail(user.email, "subject", num.toString());

  console.log(num);
  console.log(encryptedOTP);

  console.log("----", user.emailVerificationToken);
  await user.save({ validateBeforeSave: false });
  return res.status(201).json(new ApiResponse(201, user, "User created"));
});

export const emailVerification = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw new ApiError(500, "No token");
  }
  const otp = crypto
    .createHash("sha256")
    .update(token.toString()) // put OTP into hash
    .digest("hex");

  console.log("OTP: ", otp);
  const user = await User.findOne({
    $and: [
      { emailVerificationToken: otp },
      { emailVerificationTokenExpiry: { $gt: Date.now() } },
    ],
  });

  if (!user) {
    throw new ApiError(404, "Invalid OTP");
  }

  user.isEmailVerified = true;

  user.emailVerificationToken = undefined;
  user.emailVerificationTokenExpiry = undefined;

  await user.save({ validateBeforeSave: false });

  return res.status(200).json(new ApiResponse(200, null, "Email verified"));
});

export const logInUser = asyncHandler(async (req, res) => {
  const { userName, email, password } = req.body;

  const findUser = await User.findOne({
    $or: [{ email }, { userName }],
  });

  if (!findUser) {
    throw new ApiError(401, "User does not exist");
  }

  if (!findUser.isEmailVerified) {
    throw new ApiError(401, "Email not verified");
  }

  const loggedInUser = await findUser.matchPassword(password);

  if (!loggedInUser) {
    throw new ApiError(401, "worng password");
  }

  findUser.password = undefined;

  const accessToken = await findUser.setAccessToken(findUser._id);
  console.log("access------------", accessToken);
  res.cookie("accessToken", accessToken);

  return res.status(201).json(new ApiResponse(201, findUser, "User Logged In"));
});

export const test = asyncHandler(async (req, res) => {
  return res.send("Hello");
});
