const mongoose = require("mongoose");
const { Schema } = mongoose;

const CartItemSchema = new Schema(
  {
    restaurantId: { type: String, required: true },
    restaurantName: String,
    itemId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    qty: { type: Number, required: true, min: 1, default: 1 },
    isVeg: Boolean,
  },
  { _id: false }
);

const CartSchema = new Schema(
  {
    // Anonymous client-generated id (stored in localStorage on the frontend).
    // Swap this for a real authenticated user id once you add auth.
    userId: { type: String, required: true, unique: true, index: true },
    items: [CartItemSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cart", CartSchema);