import express from "express";
import generateUrl from "../controllers/url.controllers.js";

const urlRoutes = express.Router();

urlRoutes.get("/", generateUrl);

export default urlRoutes;
