import { Router } from "express";
import { Restaurant } from "./restaurant.model.js";

export const restaurantRouter = Router();

// Public list: hides the menu to keep the response small.
restaurantRouter.get("/", async (_req, res, next) => {
  try {
    const restaurants = await Restaurant.find()
      .select("-menu")
      .sort({ rating: -1, name: 1 })
      .lean();
    res.json({ restaurants });
  } catch (error) {
    next(error);
  }
});

// Public detail: includes the full menu.
restaurantRouter.get("/:slug", async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ slug: req.params.slug }).lean();
    if (!restaurant) {
      res.status(404).json({ error: "Restaurant not found" });
      return;
    }
    res.json({ restaurant });
  } catch (error) {
    next(error);
  }
});
