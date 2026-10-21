const mongoose = require("mongoose");
(async () => {
  await mongoose.connect("mongodb://127.0.0.1:27017/biteverse");
  const all = await mongoose.connection.db.collection("orders_v2").find({}).sort({ createdAt: 1 }).toArray();
  console.log("orders_v2 documents: " + all.length);
  const groups = {};
  for (const o of all) {
    const k = String(o.groupId);
    (groups[k] = groups[k] || []).push(o.restaurantName + " (total " + o.total + ")");
  }
  for (const [k, v] of Object.entries(groups)) console.log("checkout " + k.slice(-6) + ": " + v.join(" | "));
  await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
