import { Router, type Request, type Response } from "express";
import { requireAuth } from "../../middleware/auth.js";
import * as orderService from "./order.service.js";
import crypto from "crypto";

const router = Router();

router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const { restaurantSlug, mode, address } = req.body;
    const userId = (req as any).user?.id as string;
    const idempotencyKey = (req.headers["idempotency-key"] as string) || crypto.randomUUID();

    if (!restaurantSlug || !mode) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const order = await orderService.createOrder(userId, restaurantSlug, mode, address, idempotencyKey);
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: "Failed to create order" });
  }
});

router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id as string;
    const orders = await orderService.getOrders(userId);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

router.get("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id as string;
    let { id } = req.params;

    if (typeof id !== "string") {
      res.status(400).json({ error: "Invalid order id" });
      return;
    }

    const order = await orderService.getOrder(userId, id);
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

export default router;
