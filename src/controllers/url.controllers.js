import Url from "../models/url.models.js";
import ApiError from "../utils/ApiError.utils.js";
import ApiResponse from "../utils/ApiResponse.utils.js";
import asyncHandler from "../utils/asyncHandler.utils.js";

import crypto from "crypto";

const generateUrl = asyncHandler(async (req, res) => {
  const { original_url } = req.body;
  if (!original_url) {
    console.log("not");
    throw new ApiError(401, "please enter url");
  }

  const uniqueCode = crypto.randomBytes(8).toString("base64url");
  const url = await Url.create({
    redirectUrl: original_url,
    uniqueCode: uniqueCode,
  });

  return res.status(200).json(new ApiResponse(200, url, "hello"));
});

export default generateUrl;
