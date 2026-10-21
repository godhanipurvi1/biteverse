require("dotenv").config();
const mongoose = require("mongoose");

const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/biteverse";

const fixes = [
  { name: "Burger Lab", deliveryMinutes: { min: 25, max: 30 }, costForTwo: 300 },
  { name: "Dosa Corner", deliveryMinutes: { min: 20, max: 25 }, costForTwo: 200 },
  { name: "Spice Route", deliveryMinutes: { min: 30, max: 40 }, costForTwo: 450 },
];

async function main() {
  await mongoose.connect(uri);
  const col = mongoose.connection.db.collection("restaurants");

  for (const fix of fixes) {
    const res = await col.updateOne(
      { name: fix.name },
      { $set: { deliveryMinutes: fix.deliveryMinutes, costForTwo: fix.costForTwo, updatedAt: new Date() } }
    );
    console.log(fix.name + ": matched " + res.matchedCount + ", modified " + res.modifiedCount);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
