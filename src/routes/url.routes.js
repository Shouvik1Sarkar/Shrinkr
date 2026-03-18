import express from "express";
import {
  allUrlsOfUser,
  generateUrl,
  getUrlStarts,
  redirectUrl,
} from "../controllers/url.controllers.js";
import { logInAuth } from "../middleware/auth.middleware.js";

const urlRoutes = express.Router();

urlRoutes.post("/", logInAuth, generateUrl);
urlRoutes.get("/allUrlsOfUser", logInAuth, allUrlsOfUser);
urlRoutes.get("/stats/:code", getUrlStarts);
urlRoutes.get("/:code", redirectUrl);

export default urlRoutes;
