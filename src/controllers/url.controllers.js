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
import { BASE_URL } from "../config/env.config.js";
import QRCode from "qrcode";

import fetch from "node-fetch";
import { useAgent } from "request-filtering-agent";

export const generateUrl = asyncHandler(async (req, res) => {
  const { original_url, expiryTime } = req.body;
  if (!original_url) {
    console.log("not");
    throw new ApiError(401, "please enter url");
  }

  // ✅ Step 1: Validate URL format
  try {
    const a = new URL(original_url);
    console.log("00000: ", a);
  } catch {
    throw new ApiError(400, "Invalid URL format");
  }

  // ✅ Step 2: Check if URL is reachable (runs server-side, no CORS issues)
  try {
    const response = await fetch(original_url, {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
      agent: useAgent(original_url),
    });
    console.log("RESPONSE: ", response);

    if (!response.ok) {
      throw new ApiError(
        400,
        `URL is not reachable (status: ${response.status})`,
      );
    }
  } catch (error) {
    if (error instanceof ApiError) throw error; // rethrow your own errors

    if (error.name === "AbortError" || error.name === "TimeoutError") {
      throw new ApiError(400, "URL timed out — site may be down");
    }

    throw new ApiError(400, `URL is not reachable: ${error.message}`);
  }

  const myUser = req.user;

  const user = await User.findById(myUser?._id);
  console.log("THIS IS ID: ", user);
  const now = new Date();
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  // const sevenDaysLater = new Date(now.getTime() + 1 * 60 * 1000);
  const customExpiry = parseExpiry(expiryTime);

  let uniqueCode;
  let exists = true;

  while (exists) {
    uniqueCode = crypto.randomBytes(8).toString("base64url");
    exists = await Url.findOne({ uniqueCode });
  }
  // console.log("00000000");
  const url = await Url.create({
    redirectUrl: original_url,
    uniqueCode: uniqueCode,
    expiryTime: customExpiry ?? sevenDaysLater,
    createdBy: user._id ?? undefined,
  });

  if (!url) {
    throw new ApiError(401, "Url not created.");
  }

  const new_url = `${BASE_URL}/api/v1/url/${url.uniqueCode}`;

  return res.status(200).json(new ApiResponse(200, [new_url, url], "hello"));
});

export const generateCustomizedUrl = asyncHandler(async (req, res) => {
  const { original_url, expiryTime } = req.body;
  if (!original_url) {
    console.log("not");
    throw new ApiError(401, "please enter url");
  }

  // ✅ Step 1: Validate URL format
  try {
    const a = new URL(original_url);
    console.log("00000: ", a);
  } catch {
    throw new ApiError(400, "Invalid URL format");
  }

  // ✅ Step 2: Check if URL is reachable (runs server-side, no CORS issues)
  try {
    const response = await fetch(original_url, {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
    });
    console.log("RESPONSE: ", response);

    if (!response.ok) {
      throw new ApiError(
        400,
        `URL is not reachable (status: ${response.status})`,
      );
    }
  } catch (error) {
    if (error instanceof ApiError) throw error; // rethrow your own errors

    if (error.name === "AbortError" || error.name === "TimeoutError") {
      throw new ApiError(400, "URL timed out — site may be down");
    }

    throw new ApiError(400, `URL is not reachable: ${error.message}`);
  }

  const customExpiry = parseExpiry(expiryTime);
  // if (!customExpiry) {
  //   throw new ApiError(400, "not expiry time");
  // }
  const myUser = req.user;

  const user = await User.findById(myUser?._id);
  console.log("THIS IS ID: ", user);
  const now = new Date();
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  // const sevenDaysLater = new Date(now.getTime() + 1 * 60 * 1000);

  let { uniqueCode } = req.body;
  let exists = await Url.findOne({ uniqueCode });

  if (exists) {
    throw new ApiError(400, "Already exists");
  }

  // console.log("00000000");

  const url = await Url.create({
    redirectUrl: original_url,
    uniqueCode: uniqueCode,
    expiryTime: customExpiry ?? sevenDaysLater,
    createdBy: user._id ?? undefined,
  });

  if (!url) {
    throw new ApiError(401, "Url not created.");
  }

  const new_url = `${BASE_URL}/api/v1/url/${url.uniqueCode}`;

  return res.status(200).json(new ApiResponse(200, [new_url, url], "hello"));
});

export const generateQRCode = asyncHandler(async (req, res) => {
  const { original_url } = req.body;
  try {
    const a = new URL(original_url);
    console.log("00000: ", a);
  } catch {
    throw new ApiError(400, "Invalid URL format");
  }

  // ✅ Step 2: Check if URL is reachable (runs server-side, no CORS issues)
  try {
    const response = await fetch(original_url, {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
    });
    console.log("RESPONSE: ", response);

    if (!response.ok) {
      throw new ApiError(
        400,
        `URL is not reachable (status: ${response.status})`,
      );
    }
  } catch (error) {
    if (error instanceof ApiError) throw error; // rethrow your own errors

    if (error.name === "AbortError" || error.name === "TimeoutError") {
      throw new ApiError(400, "URL timed out — site may be down");
    }

    throw new ApiError(400, `URL is not reachable: ${error.message}`);
  }
  try {
    // returns a base64 encoded PNG string
    const qrCode = await QRCode.toDataURL(original_url, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });
    // return qrCode; // looks like: "data:image/png;base64,iVBORw0KGgo..."
    return res.status(200).json(new ApiResponse(200, qrCode, "done"));
  } catch (error) {
    throw new Error(`QR code generation failed: ${error}`);
  }
});

export const redirectUrl = asyncHandler(async (req, res) => {
  const { code } = req.params;
  console.log("CODE: ", code);
  const url = await Url.findOne({
    uniqueCode: code,
    expiryTime: { $gt: Date.now() },
  });

  if (!url) {
    throw new ApiError(404, "URL NOT FOUND");
  }

  if (url.isDeActivate) {
    console.log("deactivatred");
    throw new ApiError(404, "de activated");
  }

  console.log("DEACTIVATED: ", url.isDeActivate);

  const ip =
    req.headers["x-forwarded-for"] || req.socket.remoteAddress || req.ip;

  const geo = geoip.lookup(ip);
  console.log("GEO----------", geo);
  const country = geo?.country || "Unknown";
  const parser = new UAParser(req.headers["user-agent"]);
  console.log("0x0x0x0x0x: ", parser.getDevice());
  const device = parser.getDevice().type || "desktop--";
  const browser = parser.getBrowser().name;
  const os = parser.getOS().name;

  console.log("---------", parser.getDevice().type);
  console.log("---------", os);

  const original_url = url.redirectUrl;
  let click = url.clicks;
  console.log("---", click);

  click += 1;
  console.log("xxx", click);
  url.clicks = click;

  await url.save();
  //************Later**************/
  // add user (created By)

  const analytics = await Analytics.create({
    url: url._id,
    ip,
    country,
    device,
    browser,
    os,
  });

  console.log("URL: ", url);
  console.log("analytics: ", analytics);

  return res.status(302).redirect(original_url);
});

export const getUrlStarts = asyncHandler(async (req, res) => {
  const myUser = req.user;
  if (!myUser) {
    throw new ApiError(400, "You are not authenticated");
  }

  const user = await User.findById(myUser._id);
  if (!user) {
    throw new ApiError(400, "You are not authenticated");
  }
  const { code } = req.params;
  const url = await Url.findOne({ createdBy: user._id, uniqueCode: code });
  console.log("url: ", url); // new ObjectId('69aef5e668641ee3108aaea5'),
  if (!url) {
    console.log("URL not found");
    throw new ApiError(400, "URL not found");
  }

  const result = await Analytics.aggregate([
    {
      $match: {
        url: url._id,
      },
    },
    {
      $facet: {
        totalClicks: [
          {
            $count: "count",
          },
        ],

        countries: [
          {
            $group: {
              _id: "$country",
              clicks: { $sum: 1 },
            },
          },
        ],

        devices: [
          {
            $group: {
              _id: "$device",
              clicks: { $sum: 1 },
            },
          },
        ],

        browsers: [
          {
            $group: {
              _id: "$browser",
              clicks: { $sum: 1 },
            },
          },
        ],
      },
    },
  ]);

  const data = result[0] ?? {};

  const countries = {};
  // console.lo
  data.countries.forEach((d) => {
    countries[d._id] = d.clicks;
  });

  const devices = {};
  // console.lo
  data.devices.forEach((d) => {
    devices[d._id] = d.clicks;
  });

  const browsers = {};
  // console.lo
  data.browsers.forEach((d) => {
    browsers[d._id] = d.clicks;
  });

  const stat = { clicks: url.clicks, countries, devices, browsers };

  // return res.send(analytics);
  return res.status(200).json(new ApiResponse(200, stat, "this is data"));
});

export const allUrlsOfUser = asyncHandler(async (req, res) => {
  console.log("PPPPPPPPPPPPP");
  const myUser = req.user;

  const user = await User.findById(myUser._id);
  if (!user) {
    throw new ApiError(400, user, "User not LoggedIn");
  }

  const allUrls = await Url.find({ createdBy: user._id });

  console.log("mmmmmmmmmmmmm", allUrls);

  return res.status(200).json(new ApiResponse(200, allUrls, "all url"));
});

export const allActiveUrls = asyncHandler(async (req, res) => {
  const myUser = req.user;
  const allUrls = await Url.find({
    createdBy: myUser._id,
    expiryTime: { $gt: new Date() },
  });
  console.log(allUrls.length);
  return res.status(200).json(new ApiResponse(200, allUrls, "All Active Urls"));
});

export const allExpiredUrls = asyncHandler(async (req, res) => {
  const myUser = req.user;
  const allUrls = await Url.find({
    createdBy: myUser._id,
    expiryTime: { $lt: new Date() },
  });
  console.log(allUrls.length);
  return res
    .status(200)
    .json(new ApiResponse(200, allUrls, "All Expired Urls"));
});

export const allClicksOfUser = asyncHandler(async (req, res) => {
  const myUser = req.user;

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
  return res.status(200).json(new ApiResponse(200, data, "data"));
});

export const deleteUrl = asyncHandler(async (req, res) => {
  const myUser = req.user;

  const user = await User.findById(myUser._id);
  // console.log("user id: ", user);
  if (!user) {
    throw new ApiError(400, "User not logged In");
  }
  // console.log("user id: ", user);

  const { url } = req.params;

  const deletedId = await Url.findOneAndDelete({
    createdBy: user._id,
    uniqueCode: url,
  });
  if (!deletedId) {
    throw new ApiError(400, "not found url");
  }
  console.log("deleted: ", deletedId);
  return res.status(200).json(new ApiResponse(200, null, "deleted"));
});

export const deActivate = asyncHandler(async (req, res) => {
  const { url } = req.params;

  const myUser = req.user;
  const user = await User.findById(myUser._id);
  const findUrl = await Url.findOne({ createdBy: user._id, uniqueCode: url });

  if (!findUrl) {
    throw new ApiError(400, "URL NOT FOUND");
  }

  if (findUrl.isDeActivate) {
    findUrl.isDeActivate = false;
    await findUrl.save({ validateBeforeSave: false });
    res.status(200).json(new ApiResponse(200, null, "ReActivated"));
  } else {
    findUrl.isDeActivate = true;
    await findUrl.save({ validateBeforeSave: false });
    res.status(200).json(new ApiResponse(200, null, "DeActivated"));
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
