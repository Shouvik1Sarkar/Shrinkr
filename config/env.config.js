import dotenv from "dotenv";

dotenv.config({
  path: `./.env.${process.env.NODE_ENV || "development"}.local`,
});
export const {
  PORT,
  MONGO_URL,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  MAILTRAP_HOST,
  MAILTRAP_PORT,
  MAILTRAP_USERNAME,
  MAILTRAP_PASSWORD,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_CLOUD_KEY,
  CLOUDINARY_CLOUD_SECRET,
  ARCJET_KEY,
  BASE_URL,
  REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_EXPIRES,
  MONGODB_TEST_URL,
  REDIS_URL,
} = process.env;
