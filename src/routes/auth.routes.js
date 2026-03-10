import express from "express";
import {
  createUser,
  logInUser,
  test,
} from "../controllers/auth.controllers.js";
import { logInAuth } from "../middleware/auth.middleware.js";

const authRoute = express.Router();

authRoute.post("/sign-up", createUser);
authRoute.post("/sign-in", logInUser);
authRoute.post("/test", logInAuth, test);

export default authRoute;
