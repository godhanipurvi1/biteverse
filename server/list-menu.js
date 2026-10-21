const mongoose = require("mongoose");
(async () => {
  await mongoose.connect("mongodb://127.0.0.1:27017/biteverse");
  const rs = await mongoose.connection.db.collection("restaurants").find({}).toArray();
  for (const r of rs) {
    console.log("=== " + r.name + " (" + (r.menu || []).length + " items) ===");
    console.log((r.menu || []).map((m) => m.name + " Rs" + m.price).join(" | "));
  }
  await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
