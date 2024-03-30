import mongoose, { Connection } from "mongoose";
import dotenv from "dotenv";

dotenv.config();
/** Avoid persistent connections while the connection counter to MongoDB remains */
let cachedConnection: Connection | null = null;

export const connectMongoDB = async () => {
  if (cachedConnection) {
    return cachedConnection;
  }
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URL as string, {
      dbName: "petparadise",
    });
    cachedConnection = conn.connection;

    console.log("MongoDB is connected successfully");
  } catch (error) {
    console.log(error);
    throw error;
  }
};
