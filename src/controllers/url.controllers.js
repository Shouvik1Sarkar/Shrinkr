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
