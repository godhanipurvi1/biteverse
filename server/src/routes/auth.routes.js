const express = require("express");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { requireAuth, signToken } = require("../middleware/auth");

const router = express.Router();
const { ObjectId } = mongoose.Types;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
let indexed = false;

function customers() {
  return mongoose.connection.db.collection("customers");
}

async function ensureIndex() {
  if (!indexed) {
    await customers().createIndex({ email: 1 }, { unique: true });
    indexed = true;
  }
}

function publicUser(c) {
  return { id: String(c._id), name: c.name, email: c.email, phone: c.phone || "" };
}

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  try {
    const name = String(req.body?.name ?? "").trim();
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    const phone = String(req.body?.phone ?? "").trim();
    const password = String(req.body?.password ?? "");
    if (!name || !EMAIL.test(email)) return res.status(400).json({ message: "Enter your name and a valid email" });
    if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters" });
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) return res.status(400).json({ message: "Password needs an uppercase letter, a number and a special character" });
    if (phone && phone.replace(/\D/g, "").length !== 10) return res.status(400).json({ message: "Enter a 10-digit phone number" });

    await ensureIndex();
    if (await customers().findOne({ email })) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }
    const now = new Date();
    const passwordHash = await bcrypt.hash(password, 12);
    const r = await customers().insertOne({ name, email, phone, passwordHash, createdAt: now, updatedAt: now });
    const user = { _id: r.insertedId, name, email, phone };
    res.status(201).json({ token: signToken(r.insertedId), user: publicUser(user) });
  } catch (err) {
    console.error("POST /api/auth/signup failed:", err.message);
    res.status(500).json({ message: "Could not create your account" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    const password = String(req.body?.password ?? "");
    const c = email ? await customers().findOne({ email }) : null;
    const ok = c && c.passwordHash && (await bcrypt.compare(password, c.passwordHash));
    if (!ok) return res.status(401).json({ message: "Email or password is incorrect" });
    res.json({ token: signToken(c._id), user: publicUser(c) });
  } catch (err) {
    console.error("POST /api/auth/login failed:", err.message);
    res.status(500).json({ message: "Could not log you in" });
  }
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req, res) => {
  try {
    const c = await customers().findOne({ _id: new ObjectId(req.customerId) });
    if (!c) return res.status(401).json({ message: "Please log in" });
    res.json({ user: publicUser(c) });
  } catch (err) {
    res.status(500).json({ message: "Could not load your account" });
  }
});

const { OAuth2Client } = require("google-auth-library");
const googleClient = new OAuth2Client();

// POST /api/auth/google  body: { credential }
router.post("/google", async (req, res) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) return res.status(503).json({ message: "Google sign-in is not set up yet" });
    const credential = String(req.body?.credential ?? "");
    if (!credential) return res.status(400).json({ message: "Missing Google sign-in" });
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: clientId });
    const p = ticket.getPayload();
    if (!p?.email || !p.email_verified) return res.status(401).json({ message: "Your Google email is not verified" });
    const email = p.email.toLowerCase();
    const name = p.name || email.split("@")[0];
    const now = new Date();
    await ensureIndex();
    let c = await customers().findOne({ email });
    if (!c) {
      const r = await customers().insertOne({ name, email, phone: "", googleId: p.sub, createdAt: now, updatedAt: now });
      c = { _id: r.insertedId, name, email, phone: "" };
    } else if (!c.googleId) {
      await customers().updateOne({ _id: c._id }, { $set: { googleId: p.sub, updatedAt: now } });
    }
    res.json({ token: signToken(c._id), user: publicUser(c) });
  } catch (err) {
    console.error("POST /api/auth/google failed:", err.message);
    res.status(401).json({ message: "Google sign-in failed. Please try again." });
  }
});

module.exports = router;
