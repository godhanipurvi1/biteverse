const mongoose = require("mongoose");
(async () => {
  await mongoose.connect("mongodb://127.0.0.1:27017/biteverse");
  const o = await mongoose.connection.db.collection("orders_v2").find({}).sort({ createdAt: -1 }).limit(1).toArray();
  for (const x of o) console.log("subtotal: " + x.subtotal + " | coupon: " + x.couponCode + " | discount: " + x.discount + " | fee: " + x.deliveryFee + " | total: " + x.total + " | groupId: " + x.groupId);
  await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
