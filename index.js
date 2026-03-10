import app from "./src/app.js";
import { PORT } from "./src/config/env.config.js";
import globalError from "./src/middleware/globalError.middleware.js";

// console.log(PORT);

app.get("/", (req, res) => {
  res.cookie("this", "ss");
  const a = req.cookies;
  res.clearCookie("this");
  //   const a = ";;;";
  console.log("a: ", a);
  return res.send(a);
});
app.use(globalError);
app.listen(PORT, () => console.log(`App running at ${PORT}`));
// this is it
