import "dotenv/config";
import mongoose from "mongoose";

await mongoose.connect(process.env.MONGO_URI ?? "mongodb://127.0.0.1:27017/biteverse");
const r = await mongoose.connection.collection("carts").deleteMany({});
console.log(`Cleared ${r.deletedCount} carts`);
await mongoose.disconnect();
