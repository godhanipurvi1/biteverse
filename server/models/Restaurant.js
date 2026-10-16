const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    cuisine: String,
    address: String,
    rating: { type: Number, default: 0 },
    isOpen: { type: Boolean, default: true },
    menu: [
      {
        name: String,
        price: Number,
        description: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Restaurant', restaurantSchema);