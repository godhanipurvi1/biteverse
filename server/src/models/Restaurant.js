const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  description: { type: String, trim: true },
});

const restaurantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    cuisine: { type: String, trim: true },
    categories: { type: [String], default: [] },
    address: { type: String, trim: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    isOpen: { type: Boolean, default: true },
    deliveryMinutes: {
      min: { type: Number, min: 0 },
      max: { type: Number, min: 0 },
    },
    costForTwo: { type: Number, min: 0 },
    offerLabel: { type: String, trim: true },
    menu: [menuItemSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Restaurant", restaurantSchema);
