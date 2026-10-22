const express = require("express");
const mongoose = require("mongoose");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
const db = () => mongoose.connection.db;
const { ObjectId } = mongoose.Types;
const IST_OFFSET = 5.5 * 60 * 60 * 1000;
const TARGET_MIN = 45;

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

function stamp(o, status) {
  const h = (o.statusHistory || []).find((x) => x.status === status);
  return h && h.at ? new Date(h.at).getTime() : null;
}

// GET /api/admin/delivery
router.get("/", async (req, res) => {
  try {
    const since = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    const orders = await db()
      .collection("orders_v2")
      .find({ createdAt: { $gte: since } }, { projection: { customer: 1, status: 1, createdAt: 1, statusHistory: 1 } })
      .toArray();

    // Delivery time: from placed to delivered, using the status history.
    const times = orders
      .filter((o) => o.status === "delivered")
      .map((o) => {
        const placed = stamp(o, "placed") ?? new Date(o.createdAt).getTime();
        const done = stamp(o, "delivered");
        return done ? (done - placed) / 60000 : null;
      })
      .filter((m) => m !== null && m >= 0);

    const avgMinutes = times.length ? Math.round(times.reduce((s, m) => s + m, 0) / times.length) : null;
    const onTimePct = times.length ? Math.round((times.filter((m) => m <= TARGET_MIN).length / times.length) * 100) : null;

    const outNow = await db().collection("orders_v2").countDocuments({ status: "out_for_delivery" });

    // Orders per hour today, in India time.
    const istNow = new Date(Date.now() + IST_OFFSET);
    const startToday = Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate()) - IST_OFFSET;
    const byHour = Array(24).fill(0);
    for (const o of orders) {
      const t = new Date(o.createdAt).getTime();
      if (t >= startToday) byHour[new Date(t + IST_OFFSET).getUTCHours()] += 1;
    }

    // Top delivery areas over the last 7 days, excluding cancelled orders.
    const areaMap = {};
    for (const o of orders) {
      if (o.status === "cancelled") continue;
      const a = String(o.customer?.address || "").split(",")[0].trim();
      if (a) areaMap[a] = (areaMap[a] || 0) + 1;
    }
    const areas = Object.entries(areaMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    res.json({
      avgMinutes,
      onTimePct,
      targetMinutes: TARGET_MIN,
      outNow,
      activeRiders: null,
      byHour,
      areas,
      deliveredCount: times.length,
    });
  } catch (err) {
    console.error("admin delivery:", err);
    res.status(500).json({ message: "Could not load delivery data" });
  }
});

module.exports = router;