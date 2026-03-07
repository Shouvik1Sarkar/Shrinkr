import mongoose from "mongoose";

const connect_db = async (url) => {
  await mongoose
    .connect(url)
    .then(() => {
      console.log("MongoDB connection success");
    })
    .catch((err) => {
      console.error("MongoDB connection error: ", err);
    });
};

export default connect_db;
