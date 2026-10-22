const express = require("express");
const mongoose = require("mongoose");
const Restaurant = require("../models/Restaurant");

const router = express.Router();

// GET /api/restaurants/:id : one restaurant, so the menu page does not download the whole list.
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid restaurant id" });
    }
    const r = await Restaurant.findById(req.params.id).lean();
    if (!r) return res.status(404).json({ success: false, message: "Restaurant not found" });
    res.json({ success: true, data: r });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
