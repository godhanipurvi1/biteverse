const fs = require("fs");
const os = require("os");
const path = require("path");
const mongoose = require("mongoose");

const apply = process.argv[2] === "apply";

(async () => {
  await mongoose.connect("mongodb://127.0.0.1:27017/biteverse");
  const col = mongoose.connection.db.collection("restaurants");
  const template = await col.findOne({ name: "Dosa Corner" });
  if (!template) throw new Error("Template restaurant Dosa Corner not found");
  console.log("Menu item fields in your data: " + Object.keys(template.menu[0]).join(", "));
  console.log("New items will have: _id, name, price");

  const dir = path.join(__dirname, "seed-data");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  const docs = [];
  const copied = new Set();
  const own = ["name", "address", "categories", "deliveryMinutes", "costForTwo", "rating", "isOpen", "offerLabel", "menu"];

  for (const f of files) {
    const raw = fs.readFileSync(path.join(dir, f), "utf8").replace(/^\uFEFF/, "");
    const d = JSON.parse(raw);
    if (await col.findOne({ name: d.name })) { console.log("SKIP (already exists): " + d.name); continue; }
    const seen = new Set();
    for (const [n, p] of d.menu) {
      if (!n || !Number.isInteger(p) || p <= 0) throw new Error(d.name + ": bad item " + n + " " + p);
      if (seen.has(n)) throw new Error(d.name + ": duplicate item " + n);
      seen.add(n);
    }
    const doc = { ...template };
    delete doc._id;
    Object.keys(doc).forEach((k) => { if (!own.includes(k)) copied.add(k); });
    Object.assign(doc, { name: d.name, address: d.address, categories: d.categories, deliveryMinutes: d.deliveryMinutes, costForTwo: d.costForTwo, rating: d.rating, isOpen: true });
    if (d.offerLabel) doc.offerLabel = d.offerLabel; else delete doc.offerLabel;
    if (doc.slug !== undefined) doc.slug = d.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const t0 = template.menu[0];
    const ratio = t0.price ? t0.priceInr / t0.price : 1;
    const NONVEG = /chicken|mutton|egg|fish|prawn|pepperoni|lamb|beef|pork|keema|salmon|tuna|crab|octopus|seafood|bacon|sausage/i;
    doc.menu = d.menu.map(([name, price]) => ({ _id: new mongoose.Types.ObjectId(), name, description: "", price, priceInr: Math.round(price * ratio), veg: !NONVEG.test(name), available: true }));
    const labels = d.categories.map((c) => c.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" "));
    doc.cuisine = Array.isArray(template.cuisine) ? labels : labels.join(", ");
    doc.createdAt = new Date(); doc.updatedAt = new Date(); doc.__v = 0;
    docs.push(doc);
    console.log("READY: " + d.name + " | " + d.categories.join(",") + " | " + doc.menu.length + " items");
  }

  console.log("Other fields copied from Dosa Corner: " + ([...copied].join(", ") || "none"));
  console.log("Total new items: " + docs.reduce((n, x) => n + x.menu.length, 0));

  if (!apply) {
    console.log("DRY RUN: nothing was written. Run with apply to save.");
  } else if (docs.length) {
    const backup = path.join(os.homedir(), "Desktop", "restaurants-backup-" + Date.now() + ".json");
    fs.writeFileSync(backup, JSON.stringify(await col.find({}).toArray(), null, 1));
    console.log("Backup saved: " + backup);
    const res = await col.insertMany(docs);
    console.log("Inserted restaurants: " + res.insertedCount);
  } else {
    console.log("Nothing to insert.");
  }
  await mongoose.disconnect();
})().catch((e) => { console.error("ERROR: " + e.message); process.exit(1); });
