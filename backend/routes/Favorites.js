const express = require("express");
const Favorite = require("../models/Favorite");
const Restaurant = require("../models/Restaurant");

const router = express.Router();

// GET /api/favorites/:userId  -> full restaurant docs the user favorited
router.get("/:userId", async (req, res) => {
  try {
    const favs = await Favorite.find({ userId: req.params.userId });
    const restaurantIds = favs.map((f) => f.restaurantId);
    const restaurants = await Restaurant.find({ id: { $in: restaurantIds } });
    res.json(restaurants);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch favorites", error: err.message });
  }
});

// POST /api/favorites/:userId  { restaurantId }
router.post("/:userId", async (req, res) => {
  try {
    const { restaurantId } = req.body;
    if (!restaurantId) return res.status(400).json({ message: "restaurantId is required" });

    await Favorite.findOneAndUpdate(
      { userId: req.params.userId, restaurantId },
      { userId: req.params.userId, restaurantId },
      { upsert: true, new: true }
    );

    res.status(201).json({ message: "Added to favorites" });
  } catch (err) {
    res.status(500).json({ message: "Failed to add favorite", error: err.message });
  }
});

// DELETE /api/favorites/:userId/:restaurantId
router.delete("/:userId/:restaurantId", async (req, res) => {
  try {
    await Favorite.deleteOne({ userId: req.params.userId, restaurantId: req.params.restaurantId });
    res.json({ message: "Removed from favorites" });
  } catch (err) {
    res.status(500).json({ message: "Failed to remove favorite", error: err.message });
  }
});

module.exports = router;