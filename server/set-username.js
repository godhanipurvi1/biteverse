const mongoose = require("mongoose");
(async () => {
  await mongoose.connect("mongodb://127.0.0.1:27017/biteverse");
  const col = mongoose.connection.db.collection("customers");
  const r = await col.updateOne({ email: "admin@biteverse.local" }, { $set: { username: "admin" } });
  console.log("matched:", r.matchedCount, "modified:", r.modifiedCount);
  const c = await col.findOne({ email: "admin@biteverse.local" }, { projection: { email: 1, username: 1, role: 1 } });
  console.log(c);
  await mongoose.disconnect();
})();
