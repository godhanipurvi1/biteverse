const express = require("express");
const mongoose = require("mongoose");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
const { ObjectId } = mongoose.Types;

// GET /api/favorites : the logged-in customer's saved restaurants, newest first.
router.get("/", requireAuth, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const favs = await db
      .collection("favorites")
      .find({ customerId: new ObjectId(req.customerId) })
      .sort({ createdAt: -1 })
      .toArray();
    const ids = favs.map((f) => f.restaurantId);
    const restaurants = ids.length
      ? await db
          .collection("restaurants")
          .find({ _id: { $in: ids } }, { projection: { menu: 0 } })
          .toArray()
      : [];
    const byId = new Map(restaurants.map((r) => [String(r._id), r]));
    const data = favs.map((f) => byId.get(String(f.restaurantId))).filter(Boolean);
    res.json({ data, ids: ids.map(String) });
  } catch (err) {
    console.error("GET /api/favorites failed:", err.message);
    res.status(500).json({ message: "Could not load your favorites" });
  }
});

// POST /api/favorites/:restaurantId : save a restaurant. Saving twice does nothing.
router.post("/:restaurantId", requireAuth, async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.restaurantId)) {
      return res.status(400).json({ message: "Invalid restaurant id" });
    }
    const db = mongoose.connection.db;
    const restaurantId = new ObjectId(req.params.restaurantId);
    const exists = await db.collection("restaurants").countDocuments({ _id: restaurantId }, { limit: 1 });
    if (!exists) return res.status(404).json({ message: "Restaurant not found" });

    const customerId = new ObjectId(req.customerId);
    await db.collection("favorites").updateOne(
      { customerId, restaurantId },
      { $setOnInsert: { customerId, restaurantId, createdAt: new Date() } },
      { upsert: true }
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error("POST /api/favorites failed:", err.message);
    res.status(500).json({ message: "Could not save the favorite" });
  }
});

// DELETE /api/favorites/:restaurantId : remove a saved restaurant.
router.delete("/:restaurantId", requireAuth, async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.restaurantId)) {
      return res.status(400).json({ message: "Invalid restaurant id" });
    }
    await mongoose.connection.db.collection("favorites").deleteOne({
      customerId: new ObjectId(req.customerId),
      restaurantId: new ObjectId(req.params.restaurantId),
    });
    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/favorites failed:", err.message);
    res.status(500).json({ message: "Could not remove the favorite" });
  }
});

module.exports = router;