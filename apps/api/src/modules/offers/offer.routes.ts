import { Router } from "express";
import mongoose from "mongoose";
import { HttpError } from "../../lib/errors.js";
import { requireAuth } from "../../middleware/auth.js";
import { requireAdmin } from "../../middleware/requireAdmin.js";
import { Offer } from "./offer.model.js";
import { findUsableOffer, listActiveOffers } from "./offer.service.js";

export const offerRouter = Router();

// Public: anyone can see which coupons are running.
offerRouter.get("/", async (_req, res) => {
  const offers = await listActiveOffers();
  res.json({ offers });
});

offerRouter.post("/validate", requireAuth, async (req, res) => {
  const { code, subtotalInr } = req.body ?? {};
  if (typeof code !== "string" || !code.trim()) throw new HttpError(400, "Enter a coupon code");
  if (typeof subtotalInr !== "number" || !Number.isFinite(subtotalInr) || subtotalInr < 0) {
    throw new HttpError(400, "Invalid subtotal");
  }
  const { offer, discountInr } = await findUsableOffer(code, subtotalInr);
  res.json({ code: offer.code, title: offer.title, discountInr });
});

export const adminOfferRouter = Router();
adminOfferRouter.use(requireAdmin);

adminOfferRouter.get("/offers", async (_req, res) => {
  res.json({ offers: await Offer.find().sort({ createdAt: -1 }).lean() });
});

adminOfferRouter.post("/offers", async (req, res) => {
  const b = req.body ?? {};
  const code = typeof b.code === "string" ? b.code.trim().toUpperCase() : "";
  if (!/^[A-Z0-9]{3,20}$/.test(code)) throw new HttpError(400, "Code must be 3-20 letters or numbers");
  if (typeof b.title !== "string" || !b.title.trim()) throw new HttpError(400, "Title is required");
  if (b.type !== "percent" && b.type !== "fixed") throw new HttpError(400, "Type must be percent or fixed");
  if (!Number.isInteger(b.value) || b.value < 1) throw new HttpError(400, "Value must be a whole number of 1 or more");
  if (b.type === "percent" && b.value > 100) throw new HttpError(400, "Percent cannot be more than 100");
  for (const k of ["minSubtotalInr", "maxDiscountInr"]) {
    if (b[k] !== undefined && (!Number.isInteger(b[k]) || b[k] < 0)) throw new HttpError(400, `${k} must be a whole number`);
  }
  try {
    const offer = await Offer.create({
      code,
      title: b.title,
      description: typeof b.description === "string" ? b.description : "",
      type: b.type,
      value: b.value,
      minSubtotalInr: b.minSubtotalInr ?? 0,
      maxDiscountInr: b.maxDiscountInr,
      expiresAt: b.expiresAt ? new Date(b.expiresAt) : undefined,
    });
    res.status(201).json({ offer });
  } catch (err) {
    if ((err as { code?: number }).code === 11000) throw new HttpError(409, "That coupon code already exists");
    throw err;
  }
});

adminOfferRouter.patch("/offers/:id", async (req, res) => {
  const id = String(req.params.id);
  if (!mongoose.isValidObjectId(id)) throw new HttpError(400, "Invalid offer id");
  if (typeof req.body?.active !== "boolean") throw new HttpError(400, "active must be true or false");
  const offer = await Offer.findByIdAndUpdate(id, { $set: { active: req.body.active } }, { new: true });
  if (!offer) throw new HttpError(404, "Offer not found");
  res.json({ offer });
});
