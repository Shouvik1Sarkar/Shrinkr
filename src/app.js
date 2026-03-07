import express from "express";
import { MONGO_URL } from "./config/env.config.js";
import connect_db from "./connection/db.js";
const app = express();

connect_db(MONGO_URL);

app.get("/", (req, res) => {
  return res.send("Hello");
});

export default app;
