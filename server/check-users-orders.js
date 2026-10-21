const mongoose = require("mongoose");
(async () => {
  await mongoose.connect("mongodb://127.0.0.1:27017/biteverse");
  const db = mongoose.connection.db;
  for (const name of ["users", "orders"]) {
    const col = db.collection(name);
    const n = await col.countDocuments();
    console.log("=== " + name + ": " + n + " documents ===");
    const sample = await col.findOne({}, { projection: { password: 0, passwordHash: 0 } });
    console.log(sample ? JSON.stringify(sample, null, 2) : "(empty)");
    console.log("indexes: " + JSON.stringify((await col.indexes()).map((i) => i.name)));
  }
  await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
