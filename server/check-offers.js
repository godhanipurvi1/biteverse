require("dotenv").config();
const mongoose = require("mongoose");
(async () => {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/biteverse");
  const docs = await mongoose.connection.db.collection("offers").find({}).limit(10).toArray();
  console.log("offers count:", docs.length);
  console.log(JSON.stringify(docs, null, 2));
  await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
