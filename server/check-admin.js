const mongoose = require("mongoose");
(async () => {
  await mongoose.connect("mongodb://127.0.0.1:27017/biteverse");
  const rows = await mongoose.connection.db.collection("customers")
    .find({}, { projection: { email: 1, name: 1, role: 1 } }).toArray();
  console.table(rows.map((r) => ({ email: r.email, name: r.name, role: r.role ?? "(none)" })));
  await mongoose.disconnect();
})();
