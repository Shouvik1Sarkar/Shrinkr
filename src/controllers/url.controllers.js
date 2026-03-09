import Url from "../models/url.models.js";
import ApiError from "../utils/ApiError.utils.js";
import ApiResponse from "../utils/ApiResponse.utils.js";
import asyncHandler from "../utils/asyncHandler.utils.js";
import geoip from "geoip-lite";
import { UAParser } from "ua-parser-js";
import crypto from "crypto";
import Analytics from "../models/analytics.models.js";

export const generateUrl = asyncHandler(async (req, res) => {
  const { original_url } = req.body;
  if (!original_url) {
    console.log("not");
    throw new ApiError(401, "please enter url");
  }
  const now = new Date();
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  // const sevenDaysLater = new Date(now.getTime() + 1 * 60 * 1000);

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
    expiryTime: sevenDaysLater,
  });

  if (!url) {
    throw new ApiError(401, "Url not created.");
  }

  const new_url = `http://localhost:8000/api/v1/url/${url.uniqueCode}`;

  return res.status(200).json(new ApiResponse(200, new_url, "hello"));
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

  url.save();
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
  const { code } = req.params;
  const url = await Url.findOne({ uniqueCode: code });
  console.log("url: ", url); // new ObjectId('69aef5e668641ee3108aaea5'),
  if (!url) {
    console.log("URL not found");
    return;
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
