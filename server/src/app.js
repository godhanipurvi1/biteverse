
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
app.use("/api/restaurants", require("./routes/restaurant-one.routes"));
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/favorites", require("./routes/favorites.routes"));
app.use("/api/auth", authRoutes);
app.use("/api/admin/analytics/summary", require("./routes/admin-analytics-summary.routes"));
app.use("/api/admin/analytics", require("./routes/admin-analytics.routes"));
app.use("/api/admin/customers", require("./routes/admin-customers.routes"));
app.use("/api/admin/offers", require("./routes/admin-offers.routes"));
app.use("/api/admin/payments", require("./routes/admin-payments.routes"));
app.use("/api/admin/delivery", require("./routes/admin-delivery.routes"));
app.use("/api/admin/reviews", require("./routes/admin-reviews.routes"));
app.use("/api/admin/profile", require("./routes/admin-profile.routes"));
app.use("/api/admin", require("./routes/admin.routes"));

app.use("/uploads", require("express").static(require("path").join(__dirname, "..", "uploads")));

app.use("/api/reviews", require("./routes/reviews.routes"));

app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

module.exports = app;


