import mongoose from "mongoose";

const email = process.argv[2]?.toLowerCase();
if (!email) {
  console.log("Usage: pnpm -C apps/api exec tsx seed/make-admin.ts you@example.com");
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI ?? "mongodb://127.0.0.1:27017/biteverse");
const result = await mongoose.connection.collection("users").updateOne({ email }, { $set: { role: "admin" } });
console.log(result.matchedCount ? `Promoted ${email} to admin` : `No user found for ${email}`);
await mongoose.disconnect();
