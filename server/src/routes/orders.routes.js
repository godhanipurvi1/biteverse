const express = require("express");
const { requireAuth, optionalAuth } = require("../middleware/auth");
const mongoose = require("mongoose");

const router = express.Router();
const { ObjectId } = mongoose.Types;

const PAYMENTS = ["upi", "card", "cod"];
const MAX_QTY = 50;

// Offer rules in rupees. Replace with a read from the offers collection once its fields are confirmed.
const OFFERS = {
  WELCOME20: { type: "percent", value: 20, max: 100, min: 200 },
  FLAT50: { type: "fixed", value: 50, min: 300 },
};

function offerDiscount(code, subtotal) {
  const o = OFFERS[code];
  if (!o) return { error: "Offer code is not valid" };
  if (subtotal < o.min) return { error: `Minimum order for ${code} is Rs ${o.min}` };
  let d = o.type === "percent" ? Math.floor((subtotal * o.value) / 100) : o.value;
  if (o.max && d > o.max) d = o.max;
  return { discount: Math.min(d, subtotal) };
}

function clean(s) {
  return String(s ?? "").trim();
}

// POST /api/orders : guest checkout. Prices come from the database, never from the browser.
router.post("/", optionalAuth, async (req, res) => {
  try {
    const body = req.body ?? {};
    const customer = {
      name: clean(body.customer?.name),
      phone: clean(body.customer?.phone),
      address: clean(body.customer?.address),
    };
    if (!customer.name || customer.phone.replace(/\D/g, "").length < 10 || !customer.address) {
      return res.status(400).json({ message: "Name, a 10-digit phone number and an address are required" });
    }
    if (!PAYMENTS.includes(body.payment)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return res.status(400).json({ message: "Your cart is empty" });
    }

    // Group the requested lines by restaurant, checking each one.
    const grouped = new Map();
    for (const it of body.items) {
      const qty = Number(it.qty);
      if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) {
        return res.status(400).json({ message: "Invalid quantity" });
      }
      if (!ObjectId.isValid(it.restaurantId) || !ObjectId.isValid(it.menuItemId)) {
        return res.status(400).json({ message: "Invalid item or restaurant id" });
      }
      const key = String(it.restaurantId);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push({ menuItemId: String(it.menuItemId), qty });
    }

    const restaurants = mongoose.connection.db.collection("restaurants");
    const now = new Date();
    const groupId = new ObjectId();
    const orderDocs = [];

    for (const [restaurantId, lines] of grouped) {
      const r = await restaurants.findOne({ _id: new ObjectId(restaurantId) });
      if (!r) return res.status(400).json({ message: "A restaurant in your cart no longer exists" });

      const priced = [];
      let subtotal = 0;
      for (const l of lines) {
        const m = (r.menu || []).find((x) => String(x._id) === l.menuItemId);
        if (!m) return res.status(400).json({ message: `An item is not on the ${r.name} menu` });
        if (m.available === false) return res.status(400).json({ message: `${m.name} is not available right now` });
        const lineTotal = m.price * l.qty;
        subtotal += lineTotal;
        priced.push({ menuItemId: m._id, name: m.name, price: m.price, qty: l.qty, lineTotal });
      }

      const deliveryFee = subtotal >= 249 ? 0 : 40;
      let discount = 0;
      let couponCode = null;
      const code = clean(body.couponCode).toUpperCase();
      if (code) {
        if (!OFFERS[code]) return res.status(400).json({ message: "Offer code is not valid" });
        const d = offerDiscount(code, subtotal);
        if (!d.error) {
          discount = d.discount;
          couponCode = code;
        }
      }

      orderDocs.push({
        _id: new ObjectId(),
        groupId,
        restaurantId: r._id,
        restaurantName: r.name,
        items: priced,
        subtotal,
        discount,
        couponCode,
        deliveryFee,
        total: subtotal - discount + deliveryFee,
        customerId: req.customerId ? new ObjectId(req.customerId) : null,
        customer,
        payment: body.payment,
        status: "placed",
        statusHistory: [{ status: "placed", at: now }],
        createdAt: now,
        updatedAt: now,
      });
    }

    await mongoose.connection.db.collection("orders_v2").insertMany(orderDocs);

    res.status(201).json({
      groupId: String(groupId),
      orders: orderDocs.map((o) => ({
        id: String(o._id),
        restaurantName: o.restaurantName,
        total: o.total,
        status: o.status,
      })),
    });
  } catch (err) {
    console.error("POST /api/orders failed:", err);
    res.status(500).json({ message: "Could not place the order" });
  }
});

// GET /api/orders : the logged-in customer's orders, newest first.
router.get("/", requireAuth, async (req, res) => {
  try {
    const orders = await mongoose.connection.db
      .collection("orders_v2")
      .find({ customerId: new ObjectId(req.customerId) })
      .sort({ createdAt: -1 })
      .toArray();
    res.json({ data: orders });
  } catch (err) {
    console.error("GET /api/orders failed:", err.message);
    res.status(500).json({ message: "Could not load your orders" });
  }
});

// GET /api/orders/:id : only the owner can read it. Other ids return 404.
router.get("/:id", requireAuth, async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ message: "Invalid id" });
    const order = await mongoose.connection.db
      .collection("orders_v2")
      .findOne({ _id: new ObjectId(req.params.id), customerId: new ObjectId(req.customerId) });
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json({ data: order });
  } catch (err) {
    console.error("GET /api/orders/:id failed:", err);
    res.status(500).json({ message: "Could not load the order" });
  }
});

// POST /api/orders/quote : totals for the cart page. Prices and coupons are checked on the server.
router.post("/quote", async (req, res) => {
  try {
    const body = req.body ?? {};
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return res.json({ groups: [], subtotal: 0, discount: 0, fee: 0, total: 0, couponApplied: null, couponMessage: "" });
    }
    const grouped = new Map();
    for (const it of body.items) {
      const qty = Number(it.qty);
      if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) return res.status(400).json({ message: "Invalid quantity" });
      if (!ObjectId.isValid(it.restaurantId) || !ObjectId.isValid(it.menuItemId)) {
        return res.status(400).json({ message: "Invalid item or restaurant id" });
      }
      const key = String(it.restaurantId);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push({ menuItemId: String(it.menuItemId), qty });
    }

    const code = clean(body.couponCode).toUpperCase();
    if (code && !OFFERS[code]) return res.status(400).json({ message: "Offer code is not valid" });

    const restaurants = mongoose.connection.db.collection("restaurants");
    const groups = [];
    const missed = [];
    let couponApplied = null;

    for (const [restaurantId, lines] of grouped) {
      const r = await restaurants.findOne({ _id: new ObjectId(restaurantId) });
      if (!r) return res.status(400).json({ message: "A restaurant in your cart no longer exists" });

      const priced = [];
      let subtotal = 0;
      for (const l of lines) {
        const m = (r.menu || []).find((x) => String(x._id) === l.menuItemId);
        if (!m) return res.status(400).json({ message: `An item is not on the ${r.name} menu` });
        if (m.available === false) return res.status(400).json({ message: `${m.name} is not available right now` });
        subtotal += m.price * l.qty;
        priced.push({ id: String(m._id), name: m.name, price: m.price, qty: l.qty, lineTotal: m.price * l.qty });
      }

      const fee = subtotal >= 249 ? 0 : 40;
      let discount = 0;
      if (code) {
        const d = offerDiscount(code, subtotal);
        if (d.error) missed.push(r.name);
        else { discount = d.discount; couponApplied = code; }
      }
      groups.push({ restaurantId, restaurantName: r.name, lines: priced, subtotal, discount, fee, total: subtotal - discount + fee });
    }

    const couponMessage = code && missed.length
      ? (couponApplied
          ? `${code} was not applied to ${missed.join(", ")} (minimum Rs ${OFFERS[code].min} per restaurant)`
          : `${code} needs a minimum of Rs ${OFFERS[code].min} from each restaurant`)
      : "";

    const sum = (k) => groups.reduce((n, g) => n + g[k], 0);
    res.json({
      groups,
      subtotal: sum("subtotal"),
      discount: sum("discount"),
      fee: sum("fee"),
      total: sum("total"),
      couponApplied,
      couponMessage,
    });
  } catch (err) {
    console.error("POST /api/orders/quote failed:", err.message);
    res.status(500).json({ message: "Could not price your cart" });
  }
});

module.exports = router;
