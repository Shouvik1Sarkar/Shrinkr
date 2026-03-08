import express from "express";
import { generateUrl, redirectUrl } from "../controllers/url.controllers.js";

const urlRoutes = express.Router();

urlRoutes.post("/", generateUrl);
urlRoutes.get("/:code", redirectUrl);

export default urlRoutes;
