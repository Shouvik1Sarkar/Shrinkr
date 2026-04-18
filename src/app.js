import express from "express";
import { MONGO_URL } from "../config/env.config.js";
import connect_db from "../connection/db.js";
import authRoute from "./routes/auth.routes.js";
import urlRoutes from "./routes/url.routes.js";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/user.routes.js";
import arcjetMiddleware from "./middleware/arcjet.middleware.js";
import cors from "cors";

const app = express();

// connect_db(MONGO_URL);
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// app.set("trust proxy", true);

const allowedOrigins = [
  "http://localhost:5173", // your local frontend (change port if different)
  "https://yourapp.vercel.app", // your production frontend URL
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (Postman, mobile apps)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // required because you use cookies (accessToken, refreshToken)
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(cookieParser());
// app.use(express.json());
app.use(arcjetMiddleware);
app.use("/api/v1/auth/", authRoute);
app.use("/api/v1/url/", urlRoutes);
app.use("/api/v1/user/", userRoutes);
export default app;
