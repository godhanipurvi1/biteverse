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

// Payment status is derived from the order, since orders have no separate payment record.
// Online orders are captured unless cancelled (refunded). Cash orders are pending until delivered.
// Cancelled cash orders have no money moved, so they are "Void".
function statusOf(o) {
  const cod = o.payment === "cod";
  if (o.status === "cancelled") return cod ? "Void" : "Refunded";
  if (cod && o.status !== "delivered") return "Pending";
  return "Captured";
}

// GET /api/admin/payments
router.get("/", async (req, res) => {
  try {
    const orders = await db()
      .collection("orders_v2")
      .find({}, { projection: { trackingCode: 1, customer: 1, payment: 1, total: 1, status: 1, createdAt: 1 } })
      .sort({ createdAt: -1 })
      .toArray();

    const rows = orders.map((o) => ({
      id: "PAY-" + String(o._id).slice(-6).toUpperCase(),
      order: o.trackingCode || String(o._id),
      customer: o.customer?.name || "Customer",
      method: o.payment || "",
      amount: Number(o.total) || 0,
      status: statusOf(o),
      at: o.createdAt,
    }));

    const bucket = (s) => {
      const list = rows.filter((r) => r.status === s);
      return { amount: list.reduce((a, r) => a + r.amount, 0), count: list.length };
    };

    res.json({
      data: rows,
      summary: { captured: bucket("Captured"), pending: bucket("Pending"), refunded: bucket("Refunded") },
    });
  } catch (err) {
    console.error("admin payments:", err);
    res.status(500).json({ message: "Could not load payments" });
  }
});

module.exports = router;