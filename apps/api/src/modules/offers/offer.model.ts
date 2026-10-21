import { Schema, model, type InferSchemaType } from "mongoose";

const offerSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    // percent: value is 1-100. fixed: value is paise off.
    type: { type: String, enum: ["percent", "fixed"], required: true },
    value: { type: Number, required: true, min: 1 },
    minSubtotalInr: { type: Number, default: 0, min: 0 },
    maxDiscountInr: { type: Number, min: 0 },
    active: { type: Boolean, default: true },
    expiresAt: { type: Date },
  },
  { timestamps: true },
);

export type OfferDoc = InferSchemaType<typeof offerSchema>;
export const Offer = model("Offer", offerSchema);
