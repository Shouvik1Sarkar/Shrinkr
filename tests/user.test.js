import request from "supertest";
import mongoose from "mongoose";
import { MONGODB_TEST_URL } from "../config/env.config.js";
import { jest } from "@jest/globals";
import connect_db from "../connection/db.js";
import crypto from "crypto";
import User from "../src/models/user.models.js";

await jest.unstable_mockModule("../src/utils/email.utils.js", () => ({
  mail: jest.fn().mockResolvedValue(true),
}));

const { default: app } = await import("../src/app.js");

// ─── Helper ───────────────────────────────────────────────
async function registerUser() {
  await request(app).post("/api/v1/auth/sign-up").send({
    firstName: "test",
    lastName: "lastTest",
    userName: "test-1",
    email: "test@example.com",
    password: "Aa$123456",
  });
}

async function verifyUserEmail() {
  const otp = 123456;
  const encryptedOTP = crypto
    .createHash("sha256")
    .update(otp.toString())
    .digest("hex");

  await User.findOneAndUpdate(
    { email: "test@example.com" },
    {
      emailVerificationToken: encryptedOTP,
      emailVerificationTokenExpiry: Date.now() + 5 * 60 * 1000,
    },
  );

  await request(app).post("/api/v1/auth/verify").send({ token: otp });
}

async function registerAndVerifyUser() {
  await registerUser();
  await verifyUserEmail();
}

async function logInUser() {
  await registerAndVerifyUser();
  const res = await request(app).post("/api/v1/auth/sign-in").send({
    email: "test@example.com",
    password: "Aa$123456",
  });
  console.log("RESPONSE IN LOGIN: ", res);
  return res.headers["set-cookie"]; // ← return cookies
}

async function logInUser2() {
  await registerAndVerifyUser();
  const res = await request(app).post("/v1/api/auth/logInUser").send({
    email: "test@example.com",
    password: "Bb$123456",
  });
  return res.headers["set-cookie"]; // ← return cookies
}

beforeAll(async () => {
  //   await mongoose.connect(MONGODB_URL);
  // console.log("CONNECTING");
  await connect_db(MONGODB_TEST_URL);
  // console.log("-----CONNECTED------");
}, 15000);

// afterAll(async () => {
//   const collections = mongoose.connection.collections;
//   for (const key in collections) {
//     await collections[key].deleteMany();
//   }
//   await mongoose.disconnect();
// }, 15000);

afterAll(async () => {
  console.log("Starting cleanup...");

  // Clear all collections
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }

  // Disconnect mongoose
  await mongoose.disconnect();

  // ✅ DISCONNECT REDIS using the helper
  try {
    const { disconnectRedis } = await import("../config/redis.config.js");
    if (disconnectRedis) {
      await disconnectRedis();
      console.log("REDIS DISCONNECTED");
    }
  } catch (error) {
    console.log("Redis disconnect error:", error.message);
  }

  // Clear all timers and mocks
  jest.clearAllTimers();
  jest.clearAllMocks();

  if (global.server) {
    await new Promise((resolve) => global.server.close(resolve));
  }

  console.log("Cleanup complete");
}, 30000);

describe("User API", () => {
  test("get my profile", async () => {
    const cookies = await logInUser();
    // console.log("USER LOGGEDIN");
    console.log("COOKIES: ", cookies);
    const res = await request(app)
      .get("/api/v1/user/getMe")
      .set("Cookie", cookies);

    console.log("RES: ", res);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("user");
  }, 15000);
  test("LogOut profile", async () => {
    const cookies = await logInUser();
    // console.log("USER LOGGEDIN");
    const res = await request(app)
      .get("/api/v1/user/logOut")
      .set("Cookie", cookies);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Logged Out");
  }, 15000);
  test("LogOut profile", async () => {
    const cookies = await logInUser();
    // console.log("USER LOGGEDIN");
    const res = await request(app)
      .get("/api/v1/user/logOut")
      .set("Cookie", cookies);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Logged Out");
  }, 15000);
});
