const express = require("express");
const Cart = require("../models/Cart");

const router = express.Router();

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ userId });
  if (!cart) cart = await Cart.create({ userId, items: [] });
  return cart;
}

// GET /api/cart/:userId
router.get("/:userId", async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.params.userId);
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch cart", error: err.message });
  }
});

// POST /api/cart/:userId  { restaurantId, restaurantName, itemId, name, price, qty, isVeg }
// Adds an item, or increases qty if it's already in the cart.
router.post("/:userId", async (req, res) => {
  try {
    const { restaurantId, restaurantName, itemId, name, price, qty = 1, isVeg } = req.body;
    if (!restaurantId || !itemId || !name || price === undefined) {
      return res.status(400).json({ message: "restaurantId, itemId, name and price are required" });
    }

    const cart = await getOrCreateCart(req.params.userId);

    // A cart can only hold items from one restaurant at a time (matches how
    // most food delivery apps behave) — clear it if switching restaurants.
    const hasOtherRestaurant = cart.items.length > 0 && cart.items[0].restaurantId !== restaurantId;
    if (hasOtherRestaurant) {
      cart.items = [];
    }

    const existing = cart.items.find((i) => i.itemId === itemId);
    if (existing) {
      existing.qty += qty;
    } else {
      cart.items.push({ restaurantId, restaurantName, itemId, name, price, qty, isVeg });
    }

    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: "Failed to update cart", error: err.message });
  }
});

// PUT /api/cart/:userId/:itemId  { qty }
router.put("/:userId/:itemId", async (req, res) => {
  try {
    const { qty } = req.body;
    const cart = await getOrCreateCart(req.params.userId);
    const item = cart.items.find((i) => i.itemId === req.params.itemId);
    if (!item) return res.status(404).json({ message: "Item not in cart" });

    if (qty <= 0) {
      cart.items = cart.items.filter((i) => i.itemId !== req.params.itemId);
    } else {
      item.qty = qty;
    }

    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: "Failed to update item", error: err.message });
  }
});

// DELETE /api/cart/:userId/:itemId
router.delete("/:userId/:itemId", async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.params.userId);
    cart.items = cart.items.filter((i) => i.itemId !== req.params.itemId);
    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: "Failed to remove item", error: err.message });
  }
});

// DELETE /api/cart/:userId  (clear whole cart, e.g. after checkout)
router.delete("/:userId", async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.params.userId);
    cart.items = [];
    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: "Failed to clear cart", error: err.message });
  }
});

module.exports = router;