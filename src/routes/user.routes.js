import {
  addOrChangeProfilePicture,
  changeForgottenPassword,
  forgotPasswordOtp,
  getMe,
  logOut,
  updatePassword,
  updateProfile,
  userStats,
} from "../controllers/users.controllers.js";
import express from "express";
import { logInAuth } from "../middleware/auth.middleware.js";
import upload from "../middleware/multer.middleware.js";

const userRoutes = express.Router();

userRoutes.post(
  "/changeProfilePricture",
  logInAuth,
  upload.single("profilePicture"),
  addOrChangeProfilePicture,
);

userRoutes.post("/updateProfile", logInAuth, updateProfile);
userRoutes.post("/updatePassword", logInAuth, updatePassword);
userRoutes.get("/logOut", logInAuth, logOut);
userRoutes.get("/forgotPasswordOtp", forgotPasswordOtp);
userRoutes.get("/changeForgottenPassword", changeForgottenPassword);
userRoutes.get("/userStats", logInAuth, userStats);
userRoutes.get("/getMe", logInAuth, getMe);

export default userRoutes;
