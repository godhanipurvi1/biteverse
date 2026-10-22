const express = require("express");
const mongoose = require("mongoose");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
const db = () => mongoose.connection.db;
const col = () => db().collection("reviews");
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

const shape = (r) => ({
  id: String(r._id),
  name: r.customerName || "Customer",
  rating: Number(r.rating) || 0,
  text: r.text || "",
  reply: r.reply || "",
  repliedAt: r.repliedAt || null,
  at: r.createdAt || null,
});

// GET /api/admin/reviews?filter=all|high|low
router.get("/", async (req, res) => {
  try {
    const docs = await col().find({}).sort({ createdAt: -1 }).toArray();
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;
    let rated = 0;
    let unreplied = 0;
    for (const r of docs) {
      const k = Math.round(Number(r.rating));
      if (k >= 1 && k <= 5) {
        counts[k] += 1;
        sum += k;
        rated += 1;
      }
      if (!r.reply) unreplied += 1;
    }
    const f = String(req.query.filter || "all");
    const rows = docs
      .filter((r) => (f === "high" ? r.rating >= 4 : f === "low" ? r.rating <= 3 : true))
      .map(shape);
    res.json({
      data: rows,
      summary: {
        total: docs.length,
        average: rated ? Math.round((sum / rated) * 10) / 10 : null,
        unreplied,
        counts,
      },
    });
  } catch (err) {
    console.error("admin reviews:", err);
    res.status(500).json({ message: "Could not load reviews" });
  }
});

// POST /api/admin/reviews/:id/reply
router.post("/:id/reply", async (req, res) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid review" });
    const text = String(req.body?.text ?? "").trim();
    if (!text) return res.status(400).json({ message: "Reply cannot be empty" });
    if (text.length > 500) return res.status(400).json({ message: "Reply is too long (500 characters max)" });

    const u = await col().updateOne({ _id: new ObjectId(id) }, { $set: { reply: text, repliedAt: new Date() } });
    if (!u.matchedCount) return res.status(404).json({ message: "Review not found" });

    const doc = await col().findOne({ _id: new ObjectId(id) });
    res.json({ data: shape(doc) });
  } catch (err) {
    console.error("admin review reply:", err);
    res.status(500).json({ message: "Could not post reply" });
  }
});

module.exports = router;