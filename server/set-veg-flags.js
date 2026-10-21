const fs = require("fs");
const os = require("os");
const path = require("path");
const mongoose = require("mongoose");

const apply = process.argv[2] === "apply";
const NONVEG = /chicken|mutton|egg|fish|prawn|pepperoni|lamb|beef|pork|keema|salmon|tuna|crab|octopus|seafood|bacon|sausage/i;

(async () => {
  await mongoose.connect("mongodb://127.0.0.1:27017/biteverse");
  const col = mongoose.connection.db.collection("restaurants");
  const rs = await col.find({}).toArray();
  const changes = [];
  for (const r of rs) {
    for (const m of r.menu || []) {
      if (typeof m.veg !== "boolean") {
        changes.push({ restaurant: r.name, id: m._id, name: m.name, proposed: !NONVEG.test(m.name) });
      }
    }
  }
  console.log("Items with no veg flag: " + changes.length);
  for (const c of changes) console.log("  " + c.restaurant + " | " + c.name + " -> " + (c.proposed ? "VEG" : "NON-VEG"));

  if (!apply) {
    console.log("DRY RUN: nothing was written. Run with apply to save.");
  } else if (changes.length) {
    const backup = path.join(os.homedir(), "Desktop", "restaurants-veg-backup-" + Date.now() + ".json");
    fs.writeFileSync(backup, JSON.stringify(rs, null, 1));
    console.log("Backup saved: " + backup);
    for (const c of changes) {
      await col.updateOne({ name: c.restaurant, "menu._id": c.id }, { $set: { "menu.$.veg": c.proposed } });
    }
    console.log("Updated items: " + changes.length);
  } else {
    console.log("Nothing to update.");
  }
  await mongoose.disconnect();
})().catch((e) => { console.error("ERROR: " + e.message); process.exit(1); });
