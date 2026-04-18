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

afterAll(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
  await mongoose.disconnect();
}, 15000);

describe("RANDOM TEST", () => {
  it("Test random", async () => {
    const res = await request(app).get("/api/v1/auth/test");

    console.log("RES: ", res.text);

    expect(res.status).toBe(200);
    // expect(res.body.data).toHaveProperty("email", "test@example.com");
    expect(res.text).toBe("Hello");
  }, 15000);
});
