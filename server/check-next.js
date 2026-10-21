const mongoose = require("mongoose");
(async () => {
  await mongoose.connect("mongodb://127.0.0.1:27017/biteverse");
  const db = mongoose.connection.db;
  const idx = await db.collection("users").indexes();
  console.log("users indexes:");
  for (const i of idx) console.log("  " + i.name + " unique=" + !!i.unique + " keys=" + JSON.stringify(i.key));
  const rs = await db.collection("restaurants").find({}).toArray();
  const NONVEG = /chicken|mutton|egg|fish|prawn|pepperoni|lamb|beef|pork|keema|salmon|tuna|crab|octopus|seafood|bacon|sausage/i;
  console.log("\nItems marked VEG but name looks non-veg:");
  for (const r of rs) for (const m of r.menu || []) if (m.veg && NONVEG.test(m.name)) console.log("  " + r.name + ": " + m.name);
  console.log("\nItems marked NON-VEG (veg = false):");
  for (const r of rs) for (const m of r.menu || []) if (m.veg === false) console.log("  " + r.name + ": " + m.name);
  await mongoose.disconnect();
})().catch(e => { console.error(e.message); process.exit(1); });
