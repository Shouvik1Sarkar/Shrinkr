import mongoose from "mongoose";

const connect_db = async (url) => {
  try {
    if (!url) {
      throw new Error("MongoDB URL missing");
    }

    await mongoose.connect(url);

    console.log("MongoDB connection success");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

export default connect_db;
