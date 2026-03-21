import mongoose from "mongoose";

const userAnalyticsSchema = new mongoose.Schema(
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

// analyticsSchema.index({ url: 1 });
// analyticsSchema.index({ url: 1, country: 1 });
// analyticsSchema.index({ url: 1, device: 1 });

const userAnalytics = mongoose.model("userAnalytics", userAnalyticsSchema);

export default Analytics;

/**
 * number of urls
 * total clicks
 * active urls
 * expired urls
 * **clicks in last 30 days
 * 
 */
