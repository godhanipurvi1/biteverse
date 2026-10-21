
const express = require("express");
const cors = require("cors");
const healthRoutes = require("./routes/health.routes");
const restaurantRoutes = require("./routes/restaurant.routes");
const offerRoutes = require("./routes/offers.routes");
const orderRoutes = require("./routes/orders.routes");
const authRoutes = require("./routes/auth.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/health", healthRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", require("./routes/admin.routes"));

app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

module.exports = app;
