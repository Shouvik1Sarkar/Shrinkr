import { addOrChangeProfilePicture } from "../controllers/users.controllers.js";
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

export default userRoutes;
