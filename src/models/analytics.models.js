import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema(
  {
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    url: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Url",
    },
    ip: { type: String },
    country: { type: String },
    device: { type: String },
    browser: { type: String },
    os: { type: String },
  },
  { timestamps: true },
);

const Analytics = mongoose.model("Analytics", analyticsSchema);

export default Analytics;
