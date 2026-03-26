import express from "express";
import {
  allActiveUrls,
  allClicksOfUser,
  allExpiredUrls,
  allUrlsOfUser,
  generateUrl,
  getUrlStarts,
  redirectUrl,
} from "../controllers/url.controllers.js";
import { logInAuth } from "../middleware/auth.middleware.js";

const urlRoutes = express.Router();

urlRoutes.post("/", logInAuth, generateUrl);
urlRoutes.get("/allUrlsOfUser", logInAuth, allUrlsOfUser);
urlRoutes.get("/allActiveUrls", logInAuth, allActiveUrls);
urlRoutes.get("/allExpiredUrls", logInAuth, allExpiredUrls);
urlRoutes.get("/allClicksOfUser", logInAuth, allClicksOfUser);
urlRoutes.get("/stats/:code", logInAuth, getUrlStarts);
urlRoutes.get("/:code", redirectUrl);

export default urlRoutes;
