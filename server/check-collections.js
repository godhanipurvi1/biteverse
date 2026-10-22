const mongoose = require("mongoose");
(async () => {
  await mongoose.connect("mongodb://127.0.0.1:27017/biteverse");
  const db = mongoose.connection.db;
  const cols = await db.listCollections().toArray();
  const rows = [];
  for (const c of cols) rows.push({ name: c.name, docs: await db.collection(c.name).countDocuments({}) });
  console.table(rows);
  await mongoose.disconnect();
})();
