const express = require("express");
const mongoose = require("mongoose");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
const db = () => mongoose.connection.db;
const { ObjectId } = mongoose.Types;

async function requireAdmin(req, res, next) {
  try {
    const c = await db().collection("customers").findOne({ _id: new ObjectId(req.customerId) });
    if (!c || c.role !== "admin") return res.status(403).json({ message: "Admins only" });
    next();
  } catch {
    res.status(403).json({ message: "Admins only" });
  }
}
router.use(requireAuth, requireAdmin);

const STATUSES = [
  ["placed", "Pending", "#e8b04b"],
  ["confirmed", "Confirmed", "#8fa8ff"],
  ["preparing", "Preparing", "#6b8cf0"],
  ["ready", "Ready for pickup", "#f0a060"],
  ["out_for_delivery", "Out for delivery", "#e85d0c"],
  ["delivered", "Delivered", "#3fb27f"],
  ["cancelled", "Cancelled", "#e0736c"],
];
const PAY_LABEL = { upi: "UPI", card: "Card", cod: "Cash" };

// GET /api/admin/analytics/summary
router.get("/", async (req, res) => {
  try {
    const orders = await db()
      .collection("orders_v2")
      .find({}, { projection: { status: 1, total: 1, payment: 1, items: 1 } })
      .toArray();

    const live = orders.filter((o) => o.status !== "cancelled");
    const cancelledCount = orders.length - live.length;
    const avgOrderValue = live.length
      ? Math.round(live.reduce((s, o) => s + (Number(o.total) || 0), 0) / live.length)
      : null;
    const cancellationPct = orders.length ? Math.round((cancelledCount / orders.length) * 100) : null;

    const qtyByName = {};
    const qtyByMenuId = {};
    let itemsSold = 0;
    for (const o of live) {
      for (const it of o.items || []) {
        const q = Number(it.qty) || 0;
        const name = it.name || "Item";
        itemsSold += q;
        qtyByName[name] = (qtyByName[name] || 0) + q;
        const id = String(it.menuItemId || "");
        if (id) qtyByMenuId[id] = (qtyByMenuId[id] || 0) + q;
      }
    }
    const topItems = Object.entries(qtyByName)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 6);

    // Vegetarian share, using each menu item's veg flag.
    const restaurants = await db().collection("restaurants").find({}, { projection: { menu: 1 } }).toArray();
    const veg = {};
    for (const r of restaurants) {
      for (const m of r.menu || []) {
        const flag = typeof m.veg === "boolean" ? m.veg : typeof m.isVeg === "boolean" ? m.isVeg : null;
        if (flag !== null) veg[String(m._id)] = flag;
      }
    }
    let vegQty = 0;
    let knownQty = 0;
    for (const [id, q] of Object.entries(qtyByMenuId)) {
      if (id in veg) {
        knownQty += q;
        if (veg[id]) vegQty += q;
      }
    }
    const vegPct = knownQty ? Math.round((vegQty / knownQty) * 100) : null;

    const statusCount = {};
    for (const o of orders) statusCount[o.status] = (statusCount[o.status] || 0) + 1;
    const statuses = STATUSES.map(([key, label, color]) => ({ key, label, color, count: statusCount[key] || 0 }));

    const payCount = {};
    for (const o of live) {
      const k = PAY_LABEL[o.payment] || o.payment || "Other";
      payCount[k] = (payCount[k] || 0) + 1;
    }
    const payments = Object.entries(payCount)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);

    res.json({
      avgOrderValue,
      cancelledCount,
      orderCount: orders.length,
      cancellationPct,
      itemsSold,
      vegPct,
      topItems,
      statuses,
      payments,
    });
  } catch (err) {
    console.error("admin analytics summary:", err);
    res.status(500).json({ message: "Could not load analytics" });
  }
});

module.exports = router;