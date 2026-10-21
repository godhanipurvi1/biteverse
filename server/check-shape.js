const mongoose = require("mongoose");
(async () => {
  await mongoose.connect("mongodb://127.0.0.1:27017/biteverse");
  const r = await mongoose.connection.db.collection("restaurants").findOne({ name: "Dosa Corner" }, { projection: { menu: { $slice: 2 } } });
  console.log("=== one restaurant (first 2 menu items) ===");
  console.log(JSON.stringify(r, null, 2));
  await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
