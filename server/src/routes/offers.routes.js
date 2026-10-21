const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

// Amounts are stored in paise even though the field names say Inr.
// Convert to rupees for the API.
function toRupees(value) {
  return typeof value === "number" ? Math.round(value) / 100 : undefined;
}

function shape(o) {
  return {
    code: o.code,
    title: o.title,
    description: o.description,
    type: o.type,
    value: o.type === "percent" ? o.value : toRupees(o.value),
    maxDiscount: toRupees(o.maxDiscountInr),
    minSubtotal: toRupees(o.minSubtotalInr),
  };
}

router.get("/", async (req, res) => {
  try {
    const docs = await mongoose.connection.db
      .collection("offers")
      .find({ active: true })
      .sort({ createdAt: -1 })
      .toArray();
    const data = docs.map(shape);
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
