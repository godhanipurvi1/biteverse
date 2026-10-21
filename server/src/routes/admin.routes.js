const express = require("express");
const mongoose = require("mongoose");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
const { ObjectId } = mongoose.Types;
const FLOW = ["placed", "confirmed", "preparing", "ready", "out_for_delivery", "delivered"];

const db = () => mongoose.connection.db;

// Only customers whose role is "admin" get through.
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

// GET /api/admin/orders?status=&q=
router.get("/orders", async (req, res) => {
  try {
    const filter = {};
    if (req.query.status && req.query.status !== "all") filter.status = String(req.query.status);
    const q = String(req.query.q || "").trim();
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ "customer.name": rx }, { "customer.phone": rx }, { restaurantName: rx }];
      if (ObjectId.isValid(q)) filter.$or.push({ _id: new ObjectId(q) });
    }
    const orders = await db().collection("orders_v2").find(filter).sort({ createdAt: -1 }).limit(300).toArray();
    res.json({ data: orders });
  } catch (err) {
    console.error("admin orders failed:", err.message);
    res.status(500).json({ message: "Could not load orders" });
  }
});

// PATCH /api/admin/orders/:id/status  body: { status }  (one step forward only)
router.patch("/orders/:id/status", async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "Invalid id" });
    const _id = new ObjectId(req.params.id);
    const order = await db().collection("orders_v2").findOne({ _id });
    if (!order) return res.status(404).json({ message: "Order not found" });
    const i = FLOW.indexOf(order.status);
    const next = FLOW[i + 1];
    if (!next || req.body?.status !== next) {
      return res.status(400).json({ message: "This order cannot move to that status yet" });
    }
    const now = new Date();
    await db().collection("orders_v2").updateOne(
      { _id },
      { $set: { status: next, updatedAt: now }, $push: { statusHistory: { status: next, at: now } } }
    );
    res.json({ ok: true, status: next });
  } catch (err) {
    console.error("admin status failed:", err.message);
    res.status(500).json({ message: "Could not update the order" });
  }
});

// PATCH /api/admin/orders/:id/cancel  body: { reason }
router.patch("/orders/:id/cancel", async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "Invalid id" });
    const _id = new ObjectId(req.params.id);
    const order = await db().collection("orders_v2").findOne({ _id });
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.status === "delivered" || order.status === "cancelled") {
      return res.status(400).json({ message: "This order can no longer be cancelled" });
    }
    const now = new Date();
    const reason = String(req.body?.reason || "Cancelled by restaurant").slice(0, 120);
    await db().collection("orders_v2").updateOne(
      { _id },
      { $set: { status: "cancelled", cancelReason: reason, updatedAt: now }, $push: { statusHistory: { status: "cancelled", at: now } } }
    );
    res.json({ ok: true, status: "cancelled" });
  } catch (err) {
    console.error("admin cancel failed:", err.message);
    res.status(500).json({ message: "Could not cancel the order" });
  }
});

// GET /api/admin/menu : every dish from every restaurant
router.get("/menu", async (req, res) => {
  try {
    const rs = await db().collection("restaurants").find({}).toArray();
    const items = [];
    for (const r of rs) {
      for (const m of r.menu || []) {
        items.push({
          id: String(m._id),
          restaurantId: String(r._id),
          restaurantName: r.name,
          name: m.name,
          price: m.price,
          veg: m.veg ?? null,
          available: m.available !== false,
          featured: m.featured === true,
        });
      }
    }
    res.json({ data: items });
  } catch (err) {
    console.error("admin menu failed:", err.message);
    res.status(500).json({ message: "Could not load the menu" });
  }
});

// PATCH /api/admin/menu/:itemId  body: { available?, featured? }
router.patch("/menu/:itemId", async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.itemId)) return res.status(400).json({ message: "Invalid id" });
    const set = {};
    if (typeof req.body?.available === "boolean") set["menu.$.available"] = req.body.available;
    if (typeof req.body?.featured === "boolean") set["menu.$.featured"] = req.body.featured;
    if (Object.keys(set).length === 0) return res.status(400).json({ message: "Nothing to change" });
    const r = await db().collection("restaurants").updateOne({ "menu._id": new ObjectId(req.params.itemId) }, { $set: set });
    if (r.matchedCount === 0) return res.status(404).json({ message: "Dish not found" });
    res.json({ ok: true });
  } catch (err) {
    console.error("admin menu update failed:", err.message);
    res.status(500).json({ message: "Could not update the dish" });
  }
});

// GET /api/admin/stats
router.get("/stats", async (req, res) => {
  try {
    const orders = db().collection("orders_v2");
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const byStatus = {};
    for (const s of [...FLOW, "cancelled"]) byStatus[s] = await orders.countDocuments({ status: s });
    const today = await orders.find({ createdAt: { $gte: start } }).toArray();
    const revenue = today.filter((o) => o.status !== "cancelled").reduce((n, o) => n + (o.total || 0), 0);
    const rs = await db().collection("restaurants").find({}).toArray();
    const dishes = rs.flatMap((r) => r.menu || []);
    res.json({
      data: {
        totalOrders: Object.values(byStatus).reduce((n, v) => n + v, 0),
        byStatus,
        todayOrders: today.length,
        todayRevenue: revenue,
        dishesTotal: dishes.length,
        dishesUnavailable: dishes.filter((m) => m.available === false).length,
      },
    });
  } catch (err) {
    console.error("admin stats failed:", err.message);
    res.status(500).json({ message: "Could not load stats" });
  }
});

module.exports = router;
