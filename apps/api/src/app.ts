import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import { errorHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { restaurantRouter } from "./modules/restaurants/restaurant.routes.js";
import cartRouter from "./modules/cart/cart.routes.js";
import orderRouter from "./modules/orders/order.routes.js";
import { adminOrderRouter } from "./modules/orders/admin.routes.js";
import { offerRouter, adminOfferRouter } from "./modules/offers/offer.routes.js";
import { adminMenuRouter } from "./modules/restaurants/admin-menu.routes.js";

export const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

app.use("/api/auth", authRouter);
app.use("/api/restaurants", restaurantRouter);
app.use("/api/cart", cartRouter);
app.use("/api/orders", orderRouter);
app.use("/api/admin", adminOrderRouter);
app.use("/api/admin", adminOfferRouter);
app.use("/api/admin", adminMenuRouter);
app.use("/api/offers", offerRouter);
app.use(errorHandler);
