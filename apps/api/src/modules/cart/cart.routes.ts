import { Router, type Request, type Response } from "express";
import { requireAuth } from "../../middleware/auth.js";
import * as cartService from "./cart.service.js";
import { HttpError } from "../../lib/errors.js";

const router = Router();

router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id as string;
    const mode = req.query.mode === "pickup" ? "pickup" : "delivery";
    const cart = await cartService.getCart(userId, mode);
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch cart" });
  }
});

router.post("/add", requireAuth, async (req: Request, res: Response) => {
  try {
    const { restaurantSlug, menuItemName, quantity, priceInr } = req.body;
    const userId = (req as any).user?.id as string;

    if (!restaurantSlug || !menuItemName || !quantity || priceInr === undefined) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const cart = await cartService.addToCart(userId, restaurantSlug, menuItemName, quantity, priceInr);
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: "Failed to add to cart" });
  }
});

router.put("/items/:menuItemName", requireAuth, async (req: Request, res: Response) => {
  try {
    const { quantity } = req.body;
    const menuItemName = req.params.menuItemName as string;
    const userId = (req as any).user?.id as string;

    if (quantity === undefined) {
      res.status(400).json({ error: "Quantity required" });
      return;
    }

    const cart = await cartService.updateCartItem(userId, decodeURIComponent(menuItemName), quantity);
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: "Failed to update cart" });
  }
});

router.delete("/items/:menuItemName", requireAuth, async (req: Request, res: Response) => {
  try {
    const menuItemName = req.params.menuItemName as string;
    const userId = (req as any).user?.id as string;

    const cart = await cartService.removeFromCart(userId, decodeURIComponent(menuItemName));
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: "Failed to remove from cart" });
  }
});

router.post("/coupon", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string;
  const code = typeof req.body?.code === "string" ? req.body.code : "";
  const mode = req.body?.mode === "pickup" ? "pickup" : "delivery";
  if (!code.trim()) throw new HttpError(400, "Enter a coupon code");
  res.json(await cartService.applyCoupon(userId, code, mode));
});

router.delete("/coupon", requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id as string;
  const mode = req.query.mode === "pickup" ? "pickup" : "delivery";
  res.json(await cartService.removeCoupon(userId, mode));
});

export default router;
