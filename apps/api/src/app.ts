import express from "express";
import mongoose from "mongoose";

export const app = express();
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});
