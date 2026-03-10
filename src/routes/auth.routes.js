import express from "express";
import { createUser, logInUser } from "../controllers/auth.controllers.js";

const authRoute = express.Router();

authRoute.post("/sign-up", createUser);
authRoute.post("/sign-in", logInUser);

export default authRoute;
