import app from "./src/app.js";
import { PORT } from "./config/env.config.js";
import globalError from "./src/middleware/globalError.middleware.js";
import connect_db from "./connection/db.js";
import { MONGO_URL } from "./config/env.config.js";

// console.log(PORT);
// app.get("/", (req, res) => {
//   res.cookie("this", "ss");
//   const a = req.cookies;
//   res.clearCookie("this");
//   //   const a = ";;;";
//   console.log("a: ", a);
//   return res.status(200).send("");
// });

app.use(globalError);

connect_db(MONGO_URL).then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
// this is it
