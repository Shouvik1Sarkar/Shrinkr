import express from "express";
import { generateUrl, getUrlStarts, redirectUrl } from "../controllers/url.controllers.js";

const urlRoutes = express.Router();

urlRoutes.post("/", generateUrl);
urlRoutes.get("/stats/:code", getUrlStarts);
urlRoutes.get("/:code", redirectUrl);

export default urlRoutes;
