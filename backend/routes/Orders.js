const express = require("express");
const Order = require("../models/Order");
const Cart = require("../models/Cart");

const router = express.Router();

// POST /api/orders  { userId, address, paymentMethod }
// Builds the order from the user's current cart, saves it, then clears the cart.
router.post("/", async (req, res) => {
  try {
    const { userId, address, paymentMethod = "cod" } = req.body;
    if (!userId) return res.status(400).json({ message: "userId is required" });

    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const subtotal = cart.items.reduce((sum, i) => sum + i.price * i.qty, 0);
    const deliveryFee = subtotal > 500 ? 0 : 40;
    const packingCharges = 15;
    const total = subtotal + deliveryFee + packingCharges;

    const order = await Order.create({
      userId,
      items: cart.items.map((i) => ({
        restaurantId: i.restaurantId,
        itemId: i.itemId,
        name: i.name,
        price: i.price,
        qty: i.qty,
      })),
      address,
      subtotal,
      deliveryFee,
      packingCharges,
      total,
      paymentMethod,
      status: "placed",
    });

    cart.items = [];
    await cart.save();

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: "Failed to place order", error: err.message });
  }
});

// GET /api/orders/:userId  (order history)
router.get("/:userId", async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders", error: err.message });
  }
});

// GET /api/orders/:userId/:orderId  (for order tracking page)
router.get("/:userId/:orderId", async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, userId: req.params.userId });
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch order", error: err.message });
  }
});

module.exports = router;