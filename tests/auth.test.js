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

describe("RANDOM TEST", () => {
  it("Test random", async () => {
    const res = await request(app).get("/api/v1/auth/test");
    console.log("RES: ", res.text);
    expect(res.status).toBe(200);
    // expect(res.body.data).toHaveProperty("email", "test@example.com");
    expect(res.text).toBe("Hello");
  }, 15000);

  it("should register a user", async () => {
    const res = await request(app).post("/api/v1/auth/sign-up").send({
      firstName: "test",
      lastName: "lastTest",
      userName: "test-1",
      email: "test@example.com",
      password: "Aa$123456",
    });
    // console.log("the data: ", res);
    // console.log("STATUS: ", res.status);

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty("email", "test@example.com");
  }, 15000);

  it("should verify email", async () => {
    // 1️⃣ Register
    await request(app).post("/v1/api/auth/signUp").send(
      {
        firstName: "test",
        lastName: "lastTest",
        userName: "test-1",
        email: "test@example.com",
        password: "Aa$123456",
      },
      { new: true },
    );

    // 2️⃣ Find user and overwrite the OTP with a known one
    const otp = 123456;
    const encryptedOTP = crypto
      .createHash("sha256")
      .update(otp.toString())
      .digest("hex");

    const updated = await User.findOneAndUpdate(
      { email: "test@example.com" },
      {
        emailVerificationToken: encryptedOTP,
        emailVerificationTokenExpiry: Date.now() + 5 * 60 * 1000,
      },
    );
    // console.log("User found:", updated?.email);
    // console.log("Token in DB:", updated?.emailVerificationToken);
    // console.log("Sending OTP:", otp);
    // console.log("Hashed OTP:", encryptedOTP);
    // console.log("User found and updated");
    // 3️⃣ Verify with the known raw OTP
    const res = await request(app)
      .post("/api/v1/auth/verify") // adjust route
      .send({ token: otp });

    //   console.log("Token in DBlll:", res);
    // console.log("otp sendt");
    // console.log("is email verified:", updated?.isEmailVerified);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Email verified");
  }, 15000);

  it("should LogIn User", async () => {
    // 1️⃣ Register
    await request(app).post("/api/v1/auth/sign-up").send(
      {
        firstName: "test",
        lastName: "lastTest",
        userName: "test-1",
        email: "test@example.com",
        password: "Aa$123456",
      },
      { new: true },
    );

    // 2️⃣ Find user and overwrite the OTP with a known one
    const otp = 123456;
    const encryptedOTP = crypto
      .createHash("sha256")
      .update(otp.toString())
      .digest("hex");

    const updated = await User.findOneAndUpdate(
      { email: "test@example.com" },
      {
        emailVerificationToken: encryptedOTP,
        emailVerificationTokenExpiry: Date.now() + 5 * 60 * 1000,
      },
    );
    // console.log("User found:", updated?.email);
    // console.log("Token in DB:", updated?.emailVerificationToken);
    // console.log("Sending OTP:", otp);
    // console.log("Hashed OTP:", encryptedOTP);
    // console.log("User found and updated");
    // 3️⃣ Verify with the known raw OTP
    const res = await request(app)
      .post("/api/v1/auth/verification") // adjust route
      .send({ token: otp });

    //   console.log("Token in DBlll:", res);
    // console.log("otp sendt");
    // console.log("is email verified:", updated?.isEmailVerified);

    // expect(res.status).toBe(200);
    // expect(res.body.message).toBe("Email verified");

    const loggedInUser = await request(app).post("/api/v1/auth/sign-in").send({
      email: "test@example.com",
      password: "Aa$123456",
    });

    console.log("LOGGEDIN USER", loggedInUser.body.data);

    expect(loggedInUser.status).toBe(200);
    expect(loggedInUser.body.message).toBe("User Logged In");

    // data checks
    expect(loggedInUser.body.data).toHaveProperty("email", "test@example.com");
  }, 15000);
});
