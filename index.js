import app from "./src/app.js";
import { PORT } from "./src/config/env.config.js";

console.log(PORT);

app.listen(PORT, () => console.log(`App running at ${PORT}`));
// this is it
