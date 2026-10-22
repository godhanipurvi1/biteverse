const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const EMAIL = "admin@biteverse.local";
const NAME = "BiteVerse Admin";
const apply = process.argv.includes("--apply");
const pw0 = process.env.ADMIN_PW; if (pw0 && (pw0.length < 8 || !/[A-Z]/.test(pw0) || !/[0-9]/.test(pw0) || !/[^A-Za-z0-9]/.test(pw0))) { console.log("Password too weak: need 8+ characters with an uppercase letter, a number and a special character. Nothing changed."); process.exit(1); }

function makePassword() {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$%&*?";
  const all = upper + lower + digits + special;
  const pick = (s) => s[crypto.randomInt(s.length)];
  const chars = [pick(upper), pick(digits), pick(special)];
  while (chars.length < 16) chars.push(pick(all));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

(async () => {
  await mongoose.connect("mongodb://127.0.0.1:27017/biteverse");
  const col = mongoose.connection.db.collection("customers");
  const total = await col.countDocuments({});
  const existing = await col.findOne({ email: EMAIL });
  console.log("customers in database:", total);
  console.log("admin email:", EMAIL, existing ? "(already exists, role: " + (existing.role ?? "none") + ")" : "(not created yet)");
  if (!apply) {
    console.log("DRY RUN: nothing was changed. Run again with --apply to create or update the admin.");
    await mongoose.disconnect();
    return;
  }
  const password = process.env.ADMIN_PW || makePassword();
  const passwordHash = await bcrypt.hash(password, 12);
  const now = new Date();
  await col.createIndex({ email: 1 }, { unique: true });
  if (existing) {
    await col.updateOne({ _id: existing._id }, { $set: { passwordHash, role: "admin", updatedAt: now } });
  } else {
    await col.insertOne({ name: NAME, email: EMAIL, phone: "", passwordHash, role: "admin", createdAt: now, updatedAt: now });
  }
  const check = await col.findOne({ email: EMAIL }, { projection: { role: 1 } });
  console.log("role now:", check.role);
  console.log("EMAIL:   ", EMAIL);
  console.log(process.env.ADMIN_PW ? "PASSWORD: the one you typed" : "PASSWORD: " + password);
  console.log("Save this password now. It is not stored anywhere in readable form.");
  await mongoose.disconnect();
})().catch((e) => { console.error("failed:", e.message); process.exit(1); });


