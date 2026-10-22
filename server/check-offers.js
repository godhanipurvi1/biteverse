const mongoose = require("mongoose");
(async () => {
  await mongoose.connect("mongodb://127.0.0.1:27017/biteverse");
  const col = mongoose.connection.db.collection("offers");
  console.log("offers count:", await col.countDocuments({}));
  console.log(JSON.stringify(await col.find({}).limit(3).toArray(), null, 2));
  await mongoose.disconnect();
})();
