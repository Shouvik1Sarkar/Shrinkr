import express, { urlencoded } from "express";
import { MONGO_URL } from "./config/env.config.js";
import connect_db from "./connection/db.js";
import authRoute from "./routes/auth.routes.js";
import urlRoutes from "./routes/url.routes.js";
import cookieParser from "cookie-parser";

const app = express();

connect_db(MONGO_URL);
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extends: true }));
app.use(cookieParser());
// app.use(express.json());

app.use("/api/v1/auth/", authRoute);
app.use("/api/v1/url/", urlRoutes);
export default app;
