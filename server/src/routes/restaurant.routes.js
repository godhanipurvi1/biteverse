const express = require("express");
const Restaurant = require("../models/Restaurant");

const router = express.Router();

// Escape user input so characters such as ( or . are matched literally
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Get all restaurants, optionally filtered by ?category= and ?q=
router.get("/", async (req, res) => {
  try {
    const category =
      typeof req.query.category === "string" ? req.query.category.trim() : "all";
    const q = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 100) : "";

    const filter = {};
    if (category && category !== "all") filter.categories = category;
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      filter.$or = [{ name: rx }, { cuisine: rx }, { "menu.name": rx }];
    }

    const restaurants = await Restaurant.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: restaurants.length,
      data: restaurants,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch restaurants",
    });
  }
});

// Get a restaurant by ID
router.get("/:id", async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    res.status(200).json({
      success: true,
      data: restaurant,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch restaurants",
    });
  }
});

module.exports = router;
