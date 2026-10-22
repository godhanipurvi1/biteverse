const express = require("express");
const mongoose = require("mongoose");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
const db = () => mongoose.connection.db;
const { ObjectId } = mongoose.Types;
const DEFAULT_PREFS = { newOrder: true, cancellation: true, paymentFailure: true, unavailableItem: false };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function requireAdmin(req, res, next) {
  try {
    const c = await db().collection("customers").findOne({ _id: new ObjectId(req.customerId) });
    if (!c || c.role !== "admin") return res.status(403).json({ message: "Admins only" });
    next();
  } catch {
    res.status(403).json({ message: "Admins only" });
  }
}
router.use(requireAuth, requireAdmin);

async function me(req) {
  return db().collection("customers").findOne(
    { _id: new ObjectId(req.customerId) },
    { projection: { passwordHash: 0 } }
  );
}

function shape(c) {
  return {
    name: c.name || "",
    email: c.email || "",
    phone: c.phone || "",
    role: c.role || "admin",
    prefs: { ...DEFAULT_PREFS, ...(c.adminPrefs || {}) },
  };
}

// GET /api/admin/profile
router.get("/", async (req, res) => {
  try {
    const c = await me(req);
    if (!c) return res.status(404).json({ message: "Account not found" });
    res.json({ data: shape(c) });
  } catch (err) {
    console.error("admin profile:", err);
    res.status(500).json({ message: "Could not load profile" });
  }
});

// PATCH /api/admin/profile : any of name, email, phone, prefs
router.patch("/", async (req, res) => {
  try {
    const b = req.body || {};
    const set = { updatedAt: new Date() };

    if (b.name !== undefined) {
      const name = String(b.name).trim();
      if (!name || name.length > 80) return res.status(400).json({ message: "Enter your name (up to 80 characters)" });
      set.name = name;
    }
    if (b.phone !== undefined) {
      const phone = String(b.phone).trim();
      if (phone && phone.replace(/\D/g, "").length < 10) return res.status(400).json({ message: "Enter a valid phone number" });
      set.phone = phone;
    }
    if (b.email !== undefined) {
      const email = String(b.email).trim().toLowerCase();
      if (!EMAIL.test(email)) return res.status(400).json({ message: "Enter a valid email address" });
      const taken = await db().collection("customers").findOne({ email, _id: { $ne: new ObjectId(req.customerId) } });
      if (taken) return res.status(409).json({ message: "That email is already used by another account" });
      set.email = email;
    }
    if (b.prefs !== undefined) {
      const p = b.prefs || {};
      const clean = {};
      for (const k of Object.keys(DEFAULT_PREFS)) clean[k] = !!p[k];
      set.adminPrefs = clean;
    }

    await db().collection("customers").updateOne({ _id: new ObjectId(req.customerId) }, { $set: set });
    const c = await me(req);
    res.json({ data: shape(c) });
  } catch (err) {
    console.error("admin profile update:", err);
    res.status(500).json({ message: "Could not save profile" });
  }
});

module.exports = router;