import Url from "../models/url.models.js";
import ApiError from "../utils/ApiError.utils.js";
import ApiResponse from "../utils/ApiResponse.utils.js";
import asyncHandler from "../utils/asyncHandler.utils.js";
import geoip from "geoip-lite";
import { UAParser } from "ua-parser-js";
import crypto from "crypto";
import Analytics from "../models/analytics.models.js";
import User from "../models/user.models.js";
import mongoose from "mongoose";
import { BASE_URL } from "../../config/env.config.js";
import QRCode from "qrcode";

import fetch from "node-fetch";
import { useAgent } from "request-filtering-agent";
import redisClient from "../../config/redis.config.js";

export const generateUrl = asyncHandler(async (req, res) => {
  const { original_url, expiryTime } = req.body;

  if (!original_url) {
    throw new ApiError(400, "Please enter a URL");
  }

  try {
    new URL(original_url);
  } catch {
    throw new ApiError(400, "Invalid URL format");
  }

  try {
    const response = await fetch(original_url, {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
      agent: useAgent(original_url),
    });

    if (!response.ok) {
      throw new ApiError(
        400,
        `URL is not reachable (status: ${response.status})`,
      );
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;

    if (error.name === "AbortError" || error.name === "TimeoutError") {
      throw new ApiError(400, "URL timed out — site may be down");
    }

    throw new ApiError(400, `URL is not reachable: ${error.message}`);
  }

  const myUser = req.user;
  const user = await User.findById(myUser?._id);

  const now = new Date();
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const customExpiry = parseExpiry(expiryTime);

  let uniqueCode;
  let exists = true;

  while (exists) {
    uniqueCode = crypto.randomBytes(8).toString("base64url");
    exists = await Url.findOne({ uniqueCode });
  }

  const url = await Url.create({
    redirectUrl: original_url,
    uniqueCode,
    expiryTime: customExpiry ?? sevenDaysLater,
    createdBy: user?._id ?? undefined,
  });

  if (!url) {
    throw new ApiError(500, "URL not created");
  }

  const new_url = `${BASE_URL}/api/v1/url/${url.uniqueCode}`;
  const userId = req.user._id;

  await redisClient.del(`user:${userId}`);
  await redisClient.del(`stats:${userId}`);

  return res
    .status(201)
    .json(new ApiResponse(201, [new_url, url], "URL created"));
});

export const generateCustomizedUrl = asyncHandler(async (req, res) => {
  const { original_url, expiryTime } = req.body;

  if (!original_url) {
    throw new ApiError(400, "Please enter a URL");
  }

  try {
    new URL(original_url);
  } catch {
    throw new ApiError(400, "Invalid URL format");
  }

  try {
    const response = await fetch(original_url, {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new ApiError(
        400,
        `URL is not reachable (status: ${response.status})`,
      );
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;

    if (error.name === "AbortError" || error.name === "TimeoutError") {
      throw new ApiError(400, "URL timed out — site may be down");
    }

    throw new ApiError(400, `URL is not reachable: ${error.message}`);
  }

  const customExpiry = parseExpiry(expiryTime);
  const myUser = req.user;
  const user = await User.findById(myUser?._id);

  const now = new Date();
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const { uniqueCode } = req.body;
  const exists = await Url.findOne({ uniqueCode });

  if (exists) {
    throw new ApiError(409, "Custom code already exists");
  }

  const url = await Url.create({
    redirectUrl: original_url,
    uniqueCode,
    expiryTime: customExpiry ?? sevenDaysLater,
    createdBy: user?._id ?? undefined,
  });

  if (!url) {
    throw new ApiError(500, "URL not created");
  }

  const new_url = `${BASE_URL}/api/v1/url/${url.uniqueCode}`;

  return res
    .status(201)
    .json(new ApiResponse(201, [new_url, url], "URL created"));
});

export const generateQRCode = asyncHandler(async (req, res) => {
  const { original_url } = req.body;

  try {
    new URL(original_url);
  } catch {
    throw new ApiError(400, "Invalid URL format");
  }

  try {
    const response = await fetch(original_url, {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new ApiError(
        400,
        `URL is not reachable (status: ${response.status})`,
      );
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;

    if (error.name === "AbortError" || error.name === "TimeoutError") {
      throw new ApiError(400, "URL timed out — site may be down");
    }

    throw new ApiError(400, `URL is not reachable: ${error.message}`);
  }

  try {
    const qrCode = await QRCode.toDataURL(original_url, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, qrCode, "QR code generated"));
  } catch (error) {
    throw new ApiError(500, `QR code generation failed: ${error}`);
  }
});

export const redirectUrl = asyncHandler(async (req, res) => {
  const { code } = req.params;

  const url = await Url.findOne({
    uniqueCode: code,
    expiryTime: { $gt: Date.now() },
  });

  if (!url) {
    throw new ApiError(404, "URL not found");
  }

  if (url.isDeActivate) {
    throw new ApiError(410, "URL has been deactivated");
  }

  const ip =
    req.headers["x-forwarded-for"] || req.socket.remoteAddress || req.ip;
  const geo = geoip.lookup(ip);
  const country = geo?.country || "Unknown";
  const parser = new UAParser(req.headers["user-agent"]);
  const device = parser.getDevice().type || "desktop";
  const browser = parser.getBrowser().name;
  const os = parser.getOS().name;

  const original_url = url.redirectUrl;
  url.clicks += 1;
  await url.save();

  await Analytics.create({ url: url._id, ip, country, device, browser, os });

  return res.status(302).redirect(original_url);
});

export const getUrlStarts = asyncHandler(async (req, res) => {
  const myUser = req.user;

  if (!myUser) {
    throw new ApiError(401, "Not logged in");
  }

  const userId = user._id;
  const cachedKey = `urlStats:${userId}`;

  const cachedUrlstats = await redisClient.get(cachedKey);
  if (cachedUrlstats) {
    return res
      .status(200)
      .json(new ApiResponse(200, JSON.parse(cachedUrlstats), "URL stats"));
  }

  const user = await User.findById(myUser._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const { code } = req.params;
  const url = await Url.findOne({ createdBy: user._id, uniqueCode: code });

  if (!url) {
    throw new ApiError(404, "URL not found");
  }

  const result = await Analytics.aggregate([
    { $match: { url: url._id } },
    {
      $facet: {
        totalClicks: [{ $count: "count" }],
        countries: [{ $group: { _id: "$country", clicks: { $sum: 1 } } }],
        devices: [{ $group: { _id: "$device", clicks: { $sum: 1 } } }],
        browsers: [{ $group: { _id: "$browser", clicks: { $sum: 1 } } }],
      },
    },
  ]);

  const data = result[0] ?? {};

  const countries = {};
  data.countries.forEach((d) => {
    countries[d._id] = d.clicks;
  });

  const devices = {};
  data.devices.forEach((d) => {
    devices[d._id] = d.clicks;
  });

  const browsers = {};
  data.browsers.forEach((d) => {
    browsers[d._id] = d.clicks;
  });

  const stat = { clicks: url.clicks, countries, devices, browsers };

  await redisClient.setEx(cachedKey, 60, JSON.stringify(stat));

  return res.status(200).json(new ApiResponse(200, stat, "URL stats"));
});

export const allUrlsOfUser = asyncHandler(async (req, res) => {
  const myUser = req.user;

  if (!myUser) {
    throw new ApiError(401, "Not logged in");
  }

  const userId = myUser._id;
  const cachedKey = `allUrlsOfUser:${userId}`;

  const cachedAllUrls = await redisClient.get(cachedKey);
  if (cachedAllUrls) {
    return res
      .status(200)
      .json(new ApiResponse(200, JSON.parse(cachedAllUrls), "All URLs"));
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const allUrls = await Url.find({ createdBy: user._id });

  await redisClient.setEx(cachedKey, 60, JSON.stringify(allUrls));

  return res.status(200).json(new ApiResponse(200, allUrls, "All URLs"));
});

export const allActiveUrls = asyncHandler(async (req, res) => {
  const myUser = req.user;

  if (!myUser) {
    throw new ApiError(401, "User not logged in");
  }

  const userId = myUser._id;
  const cachedKey = `allActiveUrls:${userId}`;

  const cachedAllActiveUrls = await redisClient.get(cachedKey);
  if (cachedAllActiveUrls) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          JSON.parse(cachedAllActiveUrls),
          "All active URLs",
        ),
      );
  }

  const allUrls = await Url.find({
    createdBy: userId,
    expiryTime: { $gt: new Date() },
  });

  await redisClient.setEx(cachedKey, 60, JSON.stringify(allUrls));

  return res.status(200).json(new ApiResponse(200, allUrls, "All active URLs"));
});

export const allExpiredUrls = asyncHandler(async (req, res) => {
  const myUser = req.user;

  if (!myUser) {
    throw new ApiError(401, "User not logged in");
  }

  const userId = myUser._id;
  const cachedKey = `allExpiredUrls:${userId}`;

  const cachedAllExpiredUrls = await redisClient.get(cachedKey);
  if (cachedAllExpiredUrls) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          JSON.parse(cachedAllExpiredUrls),
          "All expired URLs",
        ),
      );
  }

  const allUrls = await Url.find({
    createdBy: userId,
    expiryTime: { $lt: new Date() },
  });

  await redisClient.setEx(cachedKey, 60, JSON.stringify(allUrls));

  return res
    .status(200)
    .json(new ApiResponse(200, allUrls, "All expired URLs"));
});

export const allClicksOfUser = asyncHandler(async (req, res) => {
  const myUser = req.user;

  if (!myUser) {
    throw new ApiError(401, "User not loggedIn");
  }

  // const userId = req.user._id;

  // const cachedKey = `allClicksOfUser:${userId}`;

  // const cachedallClicksOfUser = await redisClient.get(cachedKey);
  // if (cachedallClicksOfUser) {
  //   return res
  //     .status(200)
  //     .json(new ApiResponse(200, JSON.parse(cachedallClicksOfUser), "data"));
  // }

  const data = await Url.aggregate([
    {
      $match: {
        createdBy: new mongoose.Types.ObjectId(myUser._id),
      },
    },
    {
      $group: {
        _id: "$createdBy",
        totalClicks: { $sum: "$clicks" },
      },
    },
  ]);

  // await redisClient.setEx(cachedKey, 60, JSON.stringify(data));

  return res.status(200).json(new ApiResponse(200, data, "data"));
});

export const deleteUrl = asyncHandler(async (req, res) => {
  const myUser = req.user;

  if (!myUser) {
    throw new ApiError(401, "Not logged in");
  }

  const user = await User.findById(myUser._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const { url } = req.params;

  const deletedId = await Url.findOneAndDelete({
    createdBy: user._id,
    uniqueCode: url,
  });

  if (!deletedId) {
    throw new ApiError(404, "URL not found");
  }

  const userId = user._id;

  await Promise.all([
    redisClient.del(`user:${userId}`),
    redisClient.del(`stats:${userId}`),
    redisClient.del(`urlStats:${userId}`),
    redisClient.del(`allUrlsOfUser:${userId}`),
    redisClient.del(`allActiveUrls:${userId}`),
  ]);

  return res.status(200).json(new ApiResponse(200, null, "URL deleted"));
});

export const deActivate = asyncHandler(async (req, res) => {
  const myUser = req.user;

  if (!myUser) {
    throw new ApiError(401, "Not logged in");
  }

  const user = await User.findById(myUser._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const { url } = req.params;
  const findUrl = await Url.findOne({ createdBy: user._id, uniqueCode: url });

  if (!findUrl) {
    throw new ApiError(404, "URL not found");
  }

  const userId = user._id;

  if (findUrl.isDeActivate) {
    findUrl.isDeActivate = false;
    await findUrl.save({ validateBeforeSave: false });
    return res.status(200).json(new ApiResponse(200, null, "URL reactivated"));
  } else {
    findUrl.isDeActivate = true;
    await findUrl.save({ validateBeforeSave: false });

    await Promise.all([
      redisClient.del(`user:${userId}`),
      redisClient.del(`stats:${userId}`),
      redisClient.del(`urlStats:${userId}`),
      redisClient.del(`allUrlsOfUser:${userId}`),
      redisClient.del(`allActiveUrls:${userId}`),
    ]);

    return res.status(200).json(new ApiResponse(200, null, "URL deactivated"));
  }
});

function parseExpiry(str) {
  if (!str) return null;

  const units = {
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
  };

  const match = str.trim().match(/^(\d+)([mhdw])$/);

  if (!match)
    throw new ApiError(400, "Invalid expiry format. Use: 30m, 2h, 1d, 1w");

  const value = parseInt(match[1]);
  const unit = match[2];

  if (value <= 0)
    throw new ApiError(400, "Expiry value must be greater than 0");

  return new Date(Date.now() + value * units[unit]);
}
