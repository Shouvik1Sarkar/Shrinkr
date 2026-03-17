import User from "../models/user.models.js";
import ApiError from "../utils/ApiError.utils.js";
import ApiResponse from "../utils/ApiResponse.utils.js";
import fs from "fs";

export async function addOrChangeProfilePicture(req, res) {
  const profilePicture = req.file;
  console.log("00000: ", profilePicture);
  if (!profilePicture) {
    throw new ApiError(401, "Profile picture required");
  }
  fs.unlinkSync(profilePicture.path);
  const myUser = req.user;

  if (!myUser) {
    throw new ApiError(401, "User not Logged In.");
  }

  const user = await User.findByIdAndUpdate(myUser._id, {
    profilePicture: profilePicture.path,
  });

  return res.status(200).json(new ApiResponse(200, user, "User here"));
}
