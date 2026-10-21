import { Router } from "express";
import { Restaurant } from "./restaurant.model.js";
import { HttpError } from "../../lib/errors.js";

export const restaurantRouter = Router();

// Public list: hides the menu to keep the response small.
restaurantRouter.get("/", async (_req, res) => {
  const restaurants = await Restaurant.find()
    .select("-menu")
    .sort({ rating: -1, name: 1 })
    .lean();
  res.json({ restaurants });
});

// Public detail: includes the full menu.
restaurantRouter.get("/:slug", async (req, res) => {
  const restaurant = await Restaurant.findOne({ slug: req.params.slug }).lean();
  if (!restaurant) throw new HttpError(404, "Restaurant not found");
  res.json({ restaurant });
});
