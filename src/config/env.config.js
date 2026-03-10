import dotenv from "dotenv";

dotenv.config({ path: `./.env.${process.NODE_ENV || "development"}.local` });
export const { PORT, MONGO_URL, JWT_SECRET, JWT_EXPIRES_IN } = process.env;
