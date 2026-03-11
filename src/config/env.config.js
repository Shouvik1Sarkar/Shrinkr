import dotenv from "dotenv";

dotenv.config({ path: `./.env.${process.NODE_ENV || "development"}.local` });
export const {
  PORT,
  MONGO_URL,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  MAILTRAP_HOST,
  MAILTRAP_PORT,
  MAILTRAP_USERNAME,
  MAILTRAP_PASSWORD,
} = process.env;
