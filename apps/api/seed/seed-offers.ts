import mongoose from "mongoose";
import { Offer } from "../src/modules/offers/offer.model.js";

await mongoose.connect(process.env.MONGO_URI ?? "mongodb://127.0.0.1:27017/biteverse");

const offers = [
  { code: "WELCOME20", title: "20% off your order", description: "Up to ₹100 off on orders above ₹200", type: "percent", value: 20, maxDiscountInr: 10000, minSubtotalInr: 20000 },
  { code: "FLAT50", title: "Flat ₹50 off", description: "On orders above ₹300", type: "fixed", value: 5000, minSubtotalInr: 30000 },
];
for (const o of offers) {
  await Offer.updateOne({ code: o.code }, { $set: o }, { upsert: true });
  console.log(`Upserted ${o.code}`);
}
await mongoose.disconnect();
