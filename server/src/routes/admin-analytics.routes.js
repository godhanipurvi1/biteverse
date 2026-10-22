const express = require("express");
const mongoose = require("mongoose");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
const db = () => mongoose.connection.db;
const TZ = "Asia/Kolkata";

async function requireAdmin(req, res, next) {
  try {
    const c = await db().collection("customers").findOne({ _id: new mongoose.Types.ObjectId(req.customerId) });
    if (!c || c.role !== "admin") return res.status(403).json({ message: "Admins only" });
    next();
  } catch {
    res.status(403).json({ message: "Admins only" });
  }
}
router.use(requireAuth, requireAdmin);

const RANGES = {
  "7d": { days: 7, format: "%Y-%m-%d" },
  "30d": { days: 30, format: "%Y-%m-%d" },
  "90d": { days: 90, format: "%G-W%V" },
  "1y": { days: 365, format: "%Y-%m" },
};

function dayKeys(n) {
  const keys = [];
  for (let i = n - 1; i >= 0; i--) {
    keys.push(new Date(Date.now() - i * 86400000).toLocaleDateString("en-CA", { timeZone: TZ }));
  }
  return keys;
}

function labelFor(range, key) {
  if (range === "7d" || range === "30d") {
    return new Date(`${key}T12:00:00+05:30`).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: TZ });
  }
  if (range === "90d") return `W${key.slice(-2)}`;
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

// GET /api/admin/analytics/trends?range=7d|30d|90d|1y (cancelled orders excluded)
router.get("/trends", async (req, res) => {
  try {
    const range = RANGES[req.query.range] ? req.query.range : "7d";
    const spec = RANGES[range];
    const start = new Date(Date.now() - spec.days * 86400000);
    const rows = await db()
      .collection("orders_v2")
      .aggregate([
        { $match: { createdAt: { $gte: start }, status: { $ne: "cancelled" } } },
        {
          $group: {
            _id: { $dateToString: { format: spec.format, date: "$createdAt", timezone: TZ } },
            revenue: { $sum: "$total" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();
    const byKey = new Map(rows.map((r) => [r._id, r]));
    const keys = range === "7d" || range === "30d" ? dayKeys(spec.days) : rows.map((r) => r._id);
    const data = keys.map((k) => {
      const r = byKey.get(k);
      return { key: k, label: labelFor(range, k), revenue: r ? Math.round(r.revenue) : 0, orders: r ? r.orders : 0 };
    });
    res.json({ data });
  } catch (err) {
    console.error("admin trends failed:", err.message);
    res.status(500).json({ message: "Could not load trends" });
  }
});

// GET /api/admin/analytics/top-dishes?limit=5
router.get("/top-dishes", async (req, res) => {
  try {
    const limit = Math.min(10, Math.max(1, Number(req.query.limit) || 5));
    const rows = await db()
      .collection("orders_v2")
      .aggregate([
        { $match: { status: { $ne: "cancelled" } } },
        { $unwind: "$items" },
        { $group: { _id: "$items.name", qty: { $sum: "$items.qty" }, revenue: { $sum: "$items.lineTotal" } } },
        { $sort: { qty: -1 } },
        { $limit: limit },
      ])
      .toArray();
    res.json({ data: rows.map((r) => ({ name: r._id, qty: r.qty, revenue: r.revenue })) });
  } catch (err) {
    console.error("admin top-dishes failed:", err.message);
    res.status(500).json({ message: "Could not load top dishes" });
  }
});

// GET /api/admin/analytics/customers : customer counts from the customers collection
router.get("/customers", async (req, res) => {
  try {
    const customers = db().collection("customers");
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const monthAgo = new Date(Date.now() - 30 * 86400000);
    const [total, newToday, activeIds] = await Promise.all([
      customers.countDocuments({}),
      customers.countDocuments({ createdAt: { $gte: start } }),
      db().collection("orders_v2").distinct("customerId", { createdAt: { $gte: monthAgo }, customerId: { $ne: null } }),
    ]);
    res.json({ data: { total, newToday, active30d: activeIds.length } });
  } catch (err) {
    console.error("admin customers failed:", err.message);
    res.status(500).json({ message: "Could not load customers" });
  }
});

module.exports = router;
