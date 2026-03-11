import User from "../models/user.models.js";
import ApiError from "../utils/ApiError.utils.js";
import ApiResponse from "../utils/ApiResponse.utils.js";
import asyncHandler from "../utils/asyncHandler.utils.js";
import cookieParser from "cookie-parser";

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

  return res.status(201).json(new ApiResponse(201, user, "User created"));
});

export const logInUser = asyncHandler(async (req, res) => {
  const { userName, email, password } = req.body;

  const findUser = await User.findOne({
    $or: [{ email }, { userName }],
  });

  if (!findUser) {
    throw new ApiError(401, "User does not exist");
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
