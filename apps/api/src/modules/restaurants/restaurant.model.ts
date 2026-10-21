import { Schema, model, type InferSchemaType } from "mongoose";

const menuItemSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    priceInr: { type: Number, required: true, min: 0 },
    veg: { type: Boolean, default: true },
    available: { type: Boolean, default: true },
  },
  { _id: true },
);

const restaurantSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    cuisine: { type: [String], default: [] },
    city: { type: String, required: true, trim: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    deliveryMinutes: { type: Number, required: true, min: 1 },
    isOpen: { type: Boolean, default: true },
    coverImage: { type: String },
    menu: { type: [menuItemSchema], default: [] },
  },
  { timestamps: true },
);

export type RestaurantDoc = InferSchemaType<typeof restaurantSchema>;
export const Restaurant = model("Restaurant", restaurantSchema);
