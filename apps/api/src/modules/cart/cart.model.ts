import { Schema, model, type InferSchemaType } from "mongoose";

const cartItemSchema = new Schema(
  {
    menuItemName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    priceInr: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const cartSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    restaurantSlug: { type: String, required: true },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true },
);

export type CartDoc = InferSchemaType<typeof cartSchema>;
export const Cart = model("Cart", cartSchema);
