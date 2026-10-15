const mongoose = require("mongoose");
const { Schema } = mongoose;

const FavoriteSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    restaurantId: { type: String, required: true },
  },
  { timestamps: true }
);

FavoriteSchema.index({ userId: 1, restaurantId: 1 }, { unique: true });

module.exports = mongoose.model("Favorite", FavoriteSchema);