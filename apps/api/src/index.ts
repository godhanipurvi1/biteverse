import "dotenv/config";
import mongoose from "mongoose";
import { app } from "./app";

const port = Number(process.env.PORT) || 4000;
const uri = process.env.MONGO_URI;

if (!uri) {
  throw new Error("MONGO_URI is missing from apps/api/.env");
}

mongoose
  .connect(uri)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(port, () => console.log(`API on http://localhost:${port}`));
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });
