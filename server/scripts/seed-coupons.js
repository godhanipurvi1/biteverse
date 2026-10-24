try { require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") }); } catch (e) {}
const mongoose = require("mongoose");

const uri =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  process.env.MONGO_URL ||
  process.env.DATABASE_URL;

if (!uri) {
  console.error("No MongoDB URI found in server/.env (tried MONGODB_URI, MONGO_URI, MONGO_URL, DATABASE_URL).");
  process.exit(1);
}

// Amounts are in paise (Inr fields), matching the existing offers.
// "fixed" uses the value in paise; "percent" uses the percentage.
const coupons = [
  { code: "WELCOME50", title: "₹50 off", description: "On orders above ₹199", type: "fixed", value: 5000, minSubtotalInr: 19900 },
  { code: "BITE10", title: "10% off", description: "Up to ₹80 off on orders above ₹250", type: "percent", value: 10, maxDiscountInr: 8000, minSubtotalInr: 25000 },
  { code: "SAVE100", title: "₹100 off", description: "On orders above ₹500", type: "fixed", value: 10000, minSubtotalInr: 50000 },
  { code: "WEEKEND15", title: "15% off", description: "Up to ₹150 off on orders above ₹400", type: "percent", value: 15, maxDiscountInr: 15000, minSubtotalInr: 40000 },
  { code: "MEGA200", title: "₹200 off", description: "On orders above ₹800", type: "fixed", value: 20000, minSubtotalInr: 80000 },
].map((c) => ({ ...c, active: true }));

(async () => {
  await mongoose.connect(uri);
  const col = mongoose.connection.db.collection("offers");
  const now = new Date();
  for (const c of coupons) {
    await col.updateOne(
      { code: c.code },
      { $set: c, $setOnInsert: { createdAt: now } },
      { upsert: true }
    );
    console.log("Saved", c.code);
  }
  await mongoose.disconnect();
  console.log("Done.");
})().catch((err) => {
  console.error("Seeding failed:", err.message);
  process.exit(1);
});