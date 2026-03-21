import User from "../models/user.models.js";
import ApiError from "../utils/ApiError.utils.js";
import ApiResponse from "../utils/ApiResponse.utils.js";
import fs from "fs";
import { uploadFile } from "../utils/cloudinary.utils.js";
import { mail } from "../utils/email.utils.js";
import crypto from "crypto";

export async function addOrChangeProfilePicture(req, res) {
  const profilePicture = req.file;
  console.log("00000: ", profilePicture);
  if (!profilePicture) {
    throw new ApiError(401, "Profile picture required");
  }

  const cloudinaryPath = await uploadFile(profilePicture.path);
  console.log("[[[", cloudinaryPath);
  //   fs.unlinkSync(profilePicture.path);
  const myUser = req.user;

  if (!myUser) {
    throw new ApiError(401, "User not Logged In.");
  }

  const user = await User.findByIdAndUpdate(myUser._id, {
    profilePicture: cloudinaryPath,
  });

  return res.status(200).json(new ApiResponse(200, user, "User here"));
}

export async function updateProfile(req, res) {
  const { firstName, lastName, userName } = req.body;

  // if (!firstname && !lastName && !userName) {
  //   throw new ApiError(400, "change one");
  // }

  const myUser = req.user;
  const updateData = {};

  if (firstName !== undefined) updateData.firstName = firstName;
  if (lastName !== undefined) updateData.lastName = lastName;
  if (userName !== undefined) updateData.userName = userName;
  if (!myUser) {
    throw new ApiError(401, "User not Logged In.");
  }

  const user = await User.findByIdAndUpdate(myUser._id, updateData, {
    new: true,
  });

  return res.status(200).json(new ApiResponse(200, user, "User updated"));
}

export async function updatePassword(req, res) {
  const { oldPassword, newPassword, repeatNewPassword } = req.body;

  const myUser = req.user;

  if (!myUser) {
    throw new ApiError(401, "User not Logged In.");
  }

  const user = await User.findById(myUser._id);

  if (!user) {
    throw new ApiError(401, "User not found");
  }

  const pass = await user.matchPassword(oldPassword, user.password);
  // console.log("xxxxx: ", pass);
  if (!pass) {
    throw new ApiError(401, "Password did not match");
  }
  const pass2 = await user.matchPassword(newPassword, user.password);
  // console.log("xxxxx: ", pass);
  if (pass2) {
    throw new ApiError(401, "not this password");
  }

  if (newPassword !== repeatNewPassword) {
    throw new ApiError(401, "new password did not match");
  }

  user.password = newPassword;

  await user.save();

  return res.status(200).json(new ApiResponse(200, user, "done"));
}

export async function logOut(req, res) {
  const user = req.user;
  if (!user) {
    throw new ApiError(400, "User not loggedIn");
  }

  return res
    .status(200)
    .clearCookie("accessToken")
    .json(new ApiResponse(200, null, "Logged Out"));
}

export async function forgotPasswordOtp(req, res) {
  const { email, userName } = req.body;
  const user = await User.findOne({
    $or: [{ email }, { userName }],
  });

  if (!user) {
    throw new ApiError(404, "Wrong credentials");
  }
  const otp = await user.generateForgotOTP();
  mail(user.email, "otp", otp.toString());

  console.log("----------", user.forgotPasswordOtp);

  // forgotPasswordOtp.forgotPasswordOtp = otp;
  // await forgotPasswordOtp.save();
  await user.save();

  console.log("OTP: ", otp);

  return res.status(200).json(new ApiResponse(200, user, "Otp Sent"));
}

export async function changeForgottenPassword(req, res) {
  const { otp, newPassword } = req.body;

  const encryptedOTP = crypto
    .createHash("sha256")
    .update(otp.toString()) // put OTP into hash
    .digest("hex");

  console.log("encrypted otp: ", encryptedOTP);

  const user = await User.findOne({
    forgotPasswordOtp: encryptedOTP,
    forgotPasswordOtpExpiry: { $gt: new Date() },
  });
  console.log("USER: ", user);
  if (!user) {
    throw new ApiError(400, "Wrong OTP");
  }
  user.password = newPassword;
  user.forgotPasswordOtp = undefined;
  user.forgotPasswordOtpExpiry = undefined;
  await user.save();
  return res.status(200).json(new ApiResponse(200, user, "user"));
}
