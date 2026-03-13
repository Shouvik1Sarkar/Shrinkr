import express from "express";
import {
  createUser,
  emailVerification,
  logInUser,
  sendEmailVerificationOTP,
  test,
} from "../controllers/auth.controllers.js";
import { logInAuth } from "../middleware/auth.middleware.js";

const authRoute = express.Router();

authRoute.post("/sign-up", createUser);
authRoute.post("/sign-in", logInUser);
authRoute.post("/verify", emailVerification);
authRoute.post("/SendverificationOTP", sendEmailVerificationOTP);
authRoute.post("/test", logInAuth, test);

export default authRoute;
