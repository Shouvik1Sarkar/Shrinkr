import express from "express";
import {
  allActiveUrls,
  allClicksOfUser,
  allExpiredUrls,
  allUrlsOfUser,
  deActivate,
  deleteUrl,
  generateCustomizedUrl,
  generateQRCode,
  generateUrl,
  getUrlStarts,
  redirectUrl,
} from "../controllers/url.controllers.js";
import { logInAuth } from "../middleware/auth.middleware.js";

const urlRoutes = express.Router();

urlRoutes.post("/", logInAuth, generateUrl);
urlRoutes.post("/generateCustomizedUrl", logInAuth, generateCustomizedUrl);
urlRoutes.get("/allUrlsOfUser", logInAuth, allUrlsOfUser);
urlRoutes.get("/allActiveUrls", logInAuth, allActiveUrls);
urlRoutes.get("/allExpiredUrls", logInAuth, allExpiredUrls);
urlRoutes.get("/allClicksOfUser", logInAuth, allClicksOfUser);
urlRoutes.get("/stats/:code", logInAuth, getUrlStarts);
urlRoutes.get("/:code", redirectUrl);
urlRoutes.get("/deleteUrl/:url", logInAuth, deleteUrl);
urlRoutes.get("/deActivate/:url", logInAuth, deActivate);
urlRoutes.post("/generateQRCode", logInAuth, generateQRCode);

export default urlRoutes;
