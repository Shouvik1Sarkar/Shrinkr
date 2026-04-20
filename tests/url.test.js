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
  // console.log("RESPONSE IN LOGIN: ", res);
  return res.headers["set-cookie"]; // ← return cookies
}

async function logInUser2() {
  await registerAndVerifyUser();
  const res = await request(app).post("/api/v1/auth/logInUser").send({
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

afterAll(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
  await mongoose.disconnect();
}, 15000);

describe("URL API", () => {
  test("shorten the URL", async () => {
    const cookies = await logInUser();
    // console.log("USER LOGGEDIN");
    // console.log("COOKIES: ", cookies);
    const res = await request(app)
      .post("/api/v1/url/")
      .send({
        original_url: "https://hivetoons.org/",
      })
      .set("Cookie", cookies);

    // console.log("RES: ", res);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("hello");
  }, 15000);
  test("All URLs", async () => {
    const cookies = await logInUser();
    // console.log("USER LOGGEDIN");
    // console.log("COOKIES: ", cookies);
    const res = await request(app)
      .get("/api/v1/url/allUrlsOfUser")
      .set("Cookie", cookies);

    // console.log("RES: ", res);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("all url");
  }, 15000);
  test("All Active URLs", async () => {
    const cookies = await logInUser();
    // console.log("USER LOGGEDIN");
    // console.log("COOKIES: ", cookies);
    const res = await request(app)
      .get("/api/v1/url/allActiveUrls")
      .set("Cookie", cookies);

    // console.log("RES: ", res);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("All Active Urls");
  }, 15000);
  test("All Expired URLs", async () => {
    const cookies = await logInUser();
    // console.log("USER LOGGEDIN");
    // console.log("COOKIES: ", cookies);
    const res = await request(app)
      .get("/api/v1/url/allExpiredUrls")
      .set("Cookie", cookies);

    // console.log("RES: ", res);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("All Expired Urls");
  }, 15000);
  test("All Clicks of User", async () => {
    const cookies = await logInUser();
    // console.log("USER LOGGEDIN");
    // console.log("COOKIES: ", cookies);

    const res = await request(app)
      .get("/api/v1/url/allClicksOfUser")
      .set("Cookie", cookies);

    // console.log("RES: ", res);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("data");
  }, 15000);
  test("get url stats", async () => {
    const cookies = await logInUser();
    // console.log("USER LOGGEDIN");
    // console.log("COOKIES: ", cookies);

    const response = await request(app)
      .post("/api/v1/url/")
      .send({
        original_url: "https://hivetoons.org/",
      })
      .set("Cookie", cookies);
    // console.log("=============RESPONSE=========: ", response.body.data[0]);

    const res = await request(app)
      .get(`/api/v1/url/stats/${response.body.data[1].uniqueCode}`)
      .set("Cookie", cookies);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("this is data");
  }, 15000);
  test("delete url", async () => {
    const cookies = await logInUser();
    // console.log("USER LOGGEDIN");
    // console.log("COOKIES: ", cookies);

    const response = await request(app)
      .post("/api/v1/url/")
      .send({
        original_url: "https://hivetoons.org/",
      })
      .set("Cookie", cookies);
    // console.log("=============RESPONSE=========: ", response.body.data[0]);

    const res = await request(app)
      .get(`/api/v1/url/deleteUrl/${response.body.data[1].uniqueCode}`)
      .set("Cookie", cookies);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("deleted");
  }, 15000);
  test("deactivate url", async () => {
    const cookies = await logInUser();
    // console.log("USER LOGGEDIN");
    // console.log("COOKIES: ", cookies);

    const response = await request(app)
      .post("/api/v1/url/")
      .send({
        original_url: "https://hivetoons.org/",
      })
      .set("Cookie", cookies);
    // console.log("=============RESPONSE=========: ", response.body.data[0]);

    const res = await request(app)
      .get(`/api/v1/url/deActivate/${response.body.data[1].uniqueCode}`)
      .set("Cookie", cookies);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("DeActivated");
  }, 15000);
});
