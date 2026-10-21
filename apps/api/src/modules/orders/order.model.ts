import { Schema, model, type InferSchemaType } from "mongoose";

const orderItemSchema = new Schema(
  {
    menuItemName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    priceInr: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    restaurantSlug: { type: String, required: true },
    items: { type: [orderItemSchema], required: true },
    mode: { type: String, enum: ["delivery", "pickup"], required: true },
    status: { type: String, enum: ["received", "accepted", "preparing", "out-for-delivery", "delivered"], default: "received" },
    address: { type: String }, // For delivery mode
    totalInr: { type: Number, required: true, min: 0 },
    subtotalInr: { type: Number, required: true, min: 0 },
    gstInr: { type: Number, required: true, min: 0 },
    deliveryFeeInr: { type: Number, default: 0, min: 0 },
    packagingInr: { type: Number, default: 0, min: 0 },
    couponCode: { type: String },
    discountInr: { type: Number, default: 0, min: 0 },
    idempotencyKey: { type: String, unique: true, sparse: true },
  },
  { timestamps: true },
);

export type OrderDoc = InferSchemaType<typeof orderSchema>;
export const Order = model("Order", orderSchema);
