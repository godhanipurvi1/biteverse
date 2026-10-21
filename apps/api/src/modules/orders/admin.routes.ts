import { Router } from "express";
import mongoose from "mongoose";
import { HttpError } from "../../lib/errors.js";
import { requireAdmin } from "../../middleware/requireAdmin.js";
import { Order } from "./order.model.js";
import { ORDER_STATUSES, canTransition, isOrderStatus, type OrderStatus } from "./order.state.js";

export const adminOrderRouter = Router();
adminOrderRouter.use(requireAdmin);

adminOrderRouter.get("/orders", async (req, res) => {
  const status = req.query.status;
  const filter = typeof status === "string" && isOrderStatus(status) ? { status } : {};
  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .limit(200)
    .populate("userId", "name email phone")
    .lean();
  res.json({ orders });
});

adminOrderRouter.patch("/orders/:id/status", async (req, res) => {
  const id = String(req.params.id);
  if (!mongoose.isValidObjectId(id)) throw new HttpError(400, "Invalid order id");
  const next = req.body?.status;
  if (!isOrderStatus(next)) throw new HttpError(400, "Invalid status");

  const order = await Order.findById(id);
  if (!order) throw new HttpError(404, "Order not found");
  if (!canTransition(order.status as OrderStatus, next, order.mode)) {
    throw new HttpError(409, `Cannot move an order from ${order.status} to ${next}`);
  }

  // The status condition makes this safe if two admins click at the same moment.
  const updated = await Order.findOneAndUpdate(
    { _id: id, status: order.status },
    { $set: { status: next } },
    { new: true },
  );
  if (!updated) throw new HttpError(409, "Order was changed by someone else. Refresh and try again.");
  res.json({ order: updated });
});

adminOrderRouter.get("/stats", async (_req, res) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const [grouped, today] = await Promise.all([
    Order.aggregate<{ _id: string; count: number }>([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Order.aggregate<{ orders: number; revenueInr: number }>([
      { $match: { createdAt: { $gte: startOfDay } } },
      { $group: { _id: null, orders: { $sum: 1 }, revenueInr: { $sum: "$totalInr" } } },
    ]),
  ]);
  const byStatus: Record<string, number> = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0]));
  for (const g of grouped) byStatus[g._id] = g.count;
  res.json({
    byStatus,
    total: Object.values(byStatus).reduce((a, b) => a + b, 0),
    today: { orders: today[0]?.orders ?? 0, revenueInr: today[0]?.revenueInr ?? 0 },
  });
});
