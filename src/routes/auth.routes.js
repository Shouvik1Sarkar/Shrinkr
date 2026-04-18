import express from "express";
import {
  createUser,
  emailVerification,
  logInUser,
  sendEmailVerificationOTP,
  test,
} from "../controllers/auth.controllers.js";
import { logInAuth } from "../middleware/auth.middleware.js";
import { logInValidator, registerValidator } from "../utils/validate.utils.js";
import validate from "../middleware/validateError.middleware.js";
import arcjetMiddleware from "../middleware/arcjet.middleware.js";

const authRoute = express.Router();

authRoute.post(
  "/sign-up",

  registerValidator(),
  validate,
  createUser,
);
authRoute.post("/sign-in", logInValidator(), validate, logInUser);
authRoute.post("/verify", emailVerification);
authRoute.post("/SendverificationOTP", sendEmailVerificationOTP);
// authRoute.get("/test", logInAuth, test);
authRoute.get("/test", test);

export default authRoute;
