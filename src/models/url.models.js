import mongoose from "mongoose";

const urlSchema = new mongoose.Schema(
  {
    redirectUrl: {
      type: String,
      required: true,
    },
    uniqueCode: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

const Url = mongoose.model("Url", urlSchema);

export default Url;
