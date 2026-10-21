require("dotenv").config();
const mongoose = require("mongoose");
(async () => {
  const email = (process.argv[2] || "").trim().toLowerCase();
  if (!email) { console.log("Usage: node set-admin.js your@email.com"); process.exit(1); }
  await mongoose.connect(process.env.MONGO_URI);
  const r = await mongoose.connection.db.collection("customers").updateOne({ email }, { $set: { role: "admin" } });
  console.log(r.matchedCount ? "Admin role set for " + email : "No account with that email. Sign up first.");
  await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
