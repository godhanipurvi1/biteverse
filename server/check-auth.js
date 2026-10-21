require("dotenv").config();
const mongoose = require("mongoose");
(async () => {
  const s = process.env.JWT_SECRET || "";
  console.log("JWT_SECRET length: " + s.length + " (needs 32 or more)");
  try {
    const jwt = require("jsonwebtoken");
    const t = jwt.sign({ sub: "abc" }, s, { algorithm: "HS256", expiresIn: "30d" });
    console.log("jwt.sign: OK, token length " + t.length);
  } catch (e) { console.log("jwt.sign FAILED: " + e.message); }
  try {
    const bcrypt = require("bcryptjs");
    const h = await bcrypt.hash("password123", 12);
    console.log("bcrypt.hash: OK");
  } catch (e) { console.log("bcrypt.hash FAILED: " + e.message); }
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const col = mongoose.connection.db.collection("customers");
    await col.createIndex({ email: 1 }, { unique: true });
    console.log("customers index: OK");
    await mongoose.disconnect();
  } catch (e) { console.log("customers index FAILED: " + e.message); }
})();
