import {
  addOrChangeProfilePicture,
  updatePassword,
  updateProfile,
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

export default userRoutes;
