import { Schema, model } from "mongoose";

const menuItemSchema = new Schema(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    restaurantSlug: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    pricePaise: { type: Number, required: true, min: 0 },
    isVeg: { type: Boolean, required: true },
    isAvailable: { type: Boolean, default: true },
    imageUrl: { type: String, default: null },
  },
  { timestamps: true }
);

menuItemSchema.index({ restaurantId: 1, name: 1 }, { unique: true });

export const MenuItem = model("MenuItem", menuItemSchema);
