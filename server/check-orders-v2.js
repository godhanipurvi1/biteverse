const mongoose = require("mongoose");
(async () => {
  await mongoose.connect("mongodb://127.0.0.1:27017/biteverse");
  const col = mongoose.connection.db.collection("orders_v2");
  console.log("orders_v2 documents: " + (await col.countDocuments()));
  const last = await col.find({}).sort({ createdAt: -1 }).limit(1).toArray();
  for (const o of last) {
    console.log("restaurant: " + o.restaurantName + " | status: " + o.status + " | subtotal: " + o.subtotal + " | fee: " + o.deliveryFee + " | total: " + o.total + " | payment: " + o.payment);
    console.log("items: " + o.items.map((i) => i.qty + " x " + i.name + " @ " + i.price).join(", "));
    console.log("customer phone: " + o.customer.phone);
  }
  await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
