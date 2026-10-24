const express = require("express");
const mongoose = require("mongoose");
const { optionalAuth } = require("../middleware/auth");

const router = express.Router();
const { ObjectId } = mongoose.Types;
const db = () => mongoose.connection.db;
const reviews = () => db().collection("reviews");
const orders = () => db().collection("orders_v2");

// GET /api/reviews/check?orderId=... : has this order already been reviewed?
router.get("/check", async (req, res) => {
  try {
    const orderId = String(req.query.orderId || "");
    if (!ObjectId.isValid(orderId)) return res.status(400).json({ message: "Invalid order" });
    const found = await reviews().findOne({ orderId }, { projection: { _id: 1 } });
    res.json({ reviewed: !!found });
  } catch (err) {
    console.error("review check failed:", err.message);
    res.status(500).json({ message: "Could not check the review" });
  }
});

// POST /api/reviews : one review per delivered order.
// Logged-in owners are matched by customerId. Guest orders are matched by tracking code.
router.post("/", optionalAuth, async (req, res) => {
  try {
    const { orderId, trackingCode, rating, text } = req.body || {};
    if (!ObjectId.isValid(orderId)) return res.status(400).json({ message: "Invalid order" });
    const stars = Math.round(Number(rating));
    if (!(stars >= 1 && stars <= 5)) return res.status(400).json({ message: "Pick 1 to 5 stars" });
    const comment = String(text || "").trim();
    if (comment.length > 500) return res.status(400).json({ message: "Review is too long (500 characters max)" });

    const order = await orders().findOne({ _id: new ObjectId(orderId) });
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.status !== "delivered") {
      return res.status(400).json({ message: "You can review an order after it is delivered" });
    }

    const ownerMatch = !!(req.customerId && order.customerId && String(order.customerId) === String(req.customerId));
    const guestMatch = !!(trackingCode && trackingCode === order.trackingCode);
    const allowed = order.customerId ? ownerMatch : guestMatch;
    if (!allowed) return res.status(403).json({ message: "This order is not yours to review" });

    const id = String(order._id);
    const exists = await reviews().findOne({ orderId: id }, { projection: { _id: 1 } });
    if (exists) return res.status(409).json({ message: "You already reviewed this order" });

    const fullName = String((order.customer && order.customer.name) || "").trim();
    await reviews().insertOne({
      orderId: id,
      trackingCode: order.trackingCode,
      restaurantId: String(order.restaurantId ?? ""),
      restaurantName: order.restaurantName || "",
      customerName: fullName.split(/\s+/)[0] || "Customer",
      rating: stars,
      text: comment,
      reply: "",
      repliedAt: null,
      createdAt: new Date(),
    });
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error("review save failed:", err.message);
    res.status(500).json({ message: "Could not save your review" });
  }
});

// GET /api/reviews/restaurant/:id : average rating and latest comments (public).
router.get("/restaurant/:id", async (req, res) => {
  try {
    const id = String(req.params.id);
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid restaurant" });
    const docs = await reviews().find({ restaurantId: id }).sort({ createdAt: -1 }).toArray();
    const sum = docs.reduce((n, r) => n + (Number(r.rating) || 0), 0);
    res.json({
      average: docs.length ? Math.round((sum / docs.length) * 10) / 10 : null,
      count: docs.length,
      data: docs.slice(0, 10).map((r) => ({
        id: String(r._id),
        name: r.customerName || "Customer",
        rating: Number(r.rating) || 0,
        text: r.text || "",
        reply: r.reply || "",
        at: r.createdAt || null,
      })),
    });
  } catch (err) {
    console.error("restaurant reviews failed:", err.message);
    res.status(500).json({ message: "Could not load reviews" });
  }
});

module.exports = router;