const express = require("express");
const Restaurant = require("../models/Restaurant");

const router = express.Router();

// GET /api/restaurants
// Supports: ?search=&category=&cuisine=&pureVeg=true&maxDeliveryTime=30&sort=rating|popularity|delivery-time|distance
router.get("/", async (req, res) => {
  try {
    const { search, category, cuisine, pureVeg, maxDeliveryTime, sort } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { cuisines: { $regex: search, $options: "i" } },
        { "menu.name": { $regex: search, $options: "i" } },
      ];
    }
    if (category) query.categoryTags = category;
    if (cuisine) query.cuisines = cuisine;
    if (pureVeg === "true") query.isPureVeg = true;
    if (maxDeliveryTime) query.deliveryMax = { $lte: Number(maxDeliveryTime) };

    let sortBy = { rating: -1 };
    if (sort === "delivery-time") sortBy = { deliveryMax: 1 };
    if (sort === "distance") sortBy = { distanceKm: 1 };
    if (sort === "rating") sortBy = { rating: -1 };

    const restaurants = await Restaurant.find(query).sort(sortBy);
    res.json(restaurants);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch restaurants", error: err.message });
  }
});

// GET /api/restaurants/offers  (restaurants that currently have a live offer)
router.get("/offers", async (req, res) => {
  try {
    const restaurants = await Restaurant.find({ offerPercent: { $gt: 0 } }).sort({ offerPercent: -1 });
    res.json(restaurants);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch offers", error: err.message });
  }
});

// GET /api/restaurants/:id  (slug id, e.g. "pizza-palace")
router.get("/:id", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ id: req.params.id });
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
    res.json(restaurant);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch restaurant", error: err.message });
  }
});

module.exports = router;