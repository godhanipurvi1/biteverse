import { Router } from "express";
import mongoose from "mongoose";
import { HttpError } from "../../lib/errors.js";
import { requireAdmin } from "../../middleware/requireAdmin.js";
import { Restaurant } from "./restaurant.model.js";

export const adminMenuRouter = Router();
adminMenuRouter.use(requireAdmin);

// Accepts only the fields it knows about. `partial` allows a PATCH to send just some of them.
function cleanItem(body: any, partial = false) {
  const out: Record<string, unknown> = {};

  if (body?.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) throw new HttpError(400, "Name is required");
    out.name = name.slice(0, 120);
  } else if (!partial) {
    throw new HttpError(400, "Name is required");
  }

  if (body?.description !== undefined) {
    out.description = String(body.description).trim().slice(0, 300);
  }

  if (body?.priceInr !== undefined) {
    const price = Number(body.priceInr);
    if (!Number.isInteger(price) || price < 0) {
      throw new HttpError(400, "Price must be a whole number of paise");
    }
    out.priceInr = price;
  } else if (!partial) {
    throw new HttpError(400, "Price is required");
  }

  if (body?.veg !== undefined) out.veg = Boolean(body.veg);
  if (body?.available !== undefined) out.available = Boolean(body.available);

  if (partial && Object.keys(out).length === 0) {
    throw new HttpError(400, "Nothing to update");
  }
  return out;
}

// All restaurants with their full menus, for the admin editor
adminMenuRouter.get("/restaurants", async (_req, res, next) => {
  try {
    const restaurants = await Restaurant.find().sort({ name: 1 }).lean();
    res.json({ restaurants });
  } catch (error) {
    next(error);
  }
});

// Add a dish to a restaurant's menu
adminMenuRouter.post("/restaurants/:slug/menu", async (req, res, next) => {
  try {
    const item = cleanItem(req.body);
    const restaurant = await Restaurant.findOneAndUpdate(
      { slug: req.params.slug },
      { $push: { menu: item } },
      { new: true },
    ).lean();
    if (!restaurant) throw new HttpError(404, "Restaurant not found");
    res.status(201).json({ restaurant });
  } catch (error) {
    next(error);
  }
});

// Edit a dish, or toggle availability by sending { available }
adminMenuRouter.patch("/restaurants/:slug/menu/:itemId", async (req, res, next) => {
  try {
    const { itemId } = req.params;
    if (!mongoose.isValidObjectId(itemId)) throw new HttpError(400, "Invalid item id");

    const changes = cleanItem(req.body, true);
    const $set = Object.fromEntries(
      Object.entries(changes).map(([key, value]) => [`menu.$.${key}`, value]),
    );

    const restaurant = await Restaurant.findOneAndUpdate(
      { slug: req.params.slug, "menu._id": itemId },
      { $set },
      { new: true },
    ).lean();
    if (!restaurant) throw new HttpError(404, "Dish or restaurant not found");
    res.json({ restaurant });
  } catch (error) {
    next(error);
  }
});