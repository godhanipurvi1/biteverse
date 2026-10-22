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

// Guests have no account, so group by the last 10 digits of their phone number.
const phoneKey = (p) => String(p || "").replace(/\D/g, "").slice(-10);
const keyOf = (o) => (o.customerId ? "id:" + String(o.customerId) : "ph:" + phoneKey(o.customer?.phone));

// GET /api/admin/customers?q=
router.get("/", async (req, res) => {
  try {
    const orders = await db()
      .collection("orders_v2")
      .find({}, { projection: { customerId: 1, customer: 1, total: 1, status: 1, createdAt: 1 } })
      .sort({ createdAt: -1 })
      .toArray();

    const map = new Map();
    for (const o of orders) {
      const key = keyOf(o);
      if (key === "ph:") continue;
      let c = map.get(key);
      if (!c) {
        c = {
          id: key,
          name: o.customer?.name || "Customer",
          phone: o.customer?.phone || "",
          area: String(o.customer?.address || "").split(",")[0].trim(),
          orders: 0,
          spent: 0,
          last: o.createdAt,
          isAccount: !!o.customerId,
        };
        map.set(key, c);
      }
      c.orders++;
      if (o.status !== "cancelled") c.spent += Number(o.total) || 0;
    }

    const all = [...map.values()];
    const live = orders.filter((o) => o.status !== "cancelled");
    const revenue = all.reduce((s, c) => s + c.spent, 0);
    const repeat = all.filter((c) => c.orders > 1).length;
    const summary = {
      customers: all.length,
      repeat,
      repeatPct: all.length ? Math.round((repeat / all.length) * 100) : 0,
      avgOrderValue: live.length ? Math.round(live.reduce((s, o) => s + (Number(o.total) || 0), 0) / live.length) : 0,
      revenue,
    };

    const q = String(req.query.q || "").trim().toLowerCase();
    const rows = all
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.area.toLowerCase().includes(q) || phoneKey(c.phone).includes(q.replace(/\D/g, "")))
      .sort((a, b) => b.spent - a.spent);

    res.json({ data: rows, summary });
  } catch (err) {
    console.error("admin customers:", err);
    res.status(500).json({ message: "Could not load customers" });
  }
});

module.exports = router;