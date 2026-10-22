const express = require("express");
const mongoose = require("mongoose");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
const db = () => mongoose.connection.db;
const col = () => db().collection("offers");

async function requireAdmin(req, res, next) {
  try {
    const c = await db().collection("customers").findOne({ _id: new mongoose.Types.ObjectId(req.customerId) });
    if (!c || c.role !== "admin") return res.status(403).json({ message: "Admins only" });
    next();
  } catch {
    res.status(403).json({ message: "Admins only" });
  }
}
router.use(requireAuth, requireAdmin);

const paise = (rupees) => Math.round(Number(rupees) * 100);

function shape(o) {
  return {
    id: String(o._id),
    code: o.code,
    title: o.title || "",
    description: o.description || "",
    type: o.type,
    value: o.type === "percent" ? o.value : (o.value || 0) / 100,
    maxDiscount: typeof o.maxDiscountInr === "number" ? o.maxDiscountInr / 100 : null,
    minSubtotal: (o.minSubtotalInr || 0) / 100,
    active: o.active !== false,
    validUntil: o.validUntil || null,
    usageLimit: o.usageLimit ?? null,
    used: o.used || 0,
    firstOrderOnly: !!o.firstOrderOnly,
    expired: !!(o.validUntil && new Date(o.validUntil) < new Date()),
    createdAt: o.createdAt,
  };
}

function clean(b) {
  const code = String(b.code ?? "").trim().toUpperCase();
  const title = String(b.title ?? "").trim();
  const description = String(b.description ?? "").trim();
  const type = b.type;
  const value = Number(b.value);
  const min = b.minSubtotal === "" || b.minSubtotal == null ? 0 : Number(b.minSubtotal);
  const hasMax = b.maxDiscount !== "" && b.maxDiscount != null;
  const max = hasMax ? Number(b.maxDiscount) : null;
  if (!/^[A-Z0-9]{3,20}$/.test(code)) return { error: "Code must be 3 to 20 letters or numbers" };
  if (!title || title.length > 80) return { error: "Enter a title (up to 80 characters)" };
  if (description.length > 200) return { error: "Description is too long (200 characters max)" };
  if (type !== "percent" && type !== "flat") return { error: "Choose percent or flat" };
  if (!(value > 0)) return { error: "Discount value must be more than 0" };
  if (type === "percent" && value > 100) return { error: "Percent cannot be more than 100" };
  if (!(min >= 0)) return { error: "Minimum order cannot be negative" };
  if (b.usageLimit !== "" && b.usageLimit != null && !(Number(b.usageLimit) >= 1)) return { error: "Usage limit must be 1 or more" };
  if (b.validUntil && isNaN(new Date(b.validUntil + "T23:59:59+05:30"))) return { error: "Enter a valid expiry date" };
  if (hasMax && !(max >= 0)) return { error: "Max discount cannot be negative" };
  return {
    doc: {
      code,
      title,
      description,
      type,
      value: type === "percent" ? value : paise(value),
      maxDiscountInr: type === "percent" && hasMax ? paise(max) : null,
      minSubtotalInr: paise(min),
      validUntil: b.validUntil ? new Date(b.validUntil + "T23:59:59+05:30") : null,
      usageLimit: b.usageLimit === "" || b.usageLimit == null ? null : Math.floor(Number(b.usageLimit)),
      firstOrderOnly: !!b.firstOrderOnly,
    },
  };
}

// GET /api/admin/offers
router.get("/", async (req, res) => {
  try {
    const docs = await col().find({}).sort({ createdAt: -1 }).toArray();
    res.json({ data: docs.map(shape) });
  } catch (err) {
    console.error("admin offers list failed:", err.message);
    res.status(500).json({ message: "Could not load offers" });
  }
});

// POST /api/admin/offers
router.post("/", async (req, res) => {
  try {
    const { doc, error } = clean(req.body || {});
    if (error) return res.status(400).json({ message: error });
    if (await col().findOne({ code: doc.code })) return res.status(409).json({ message: "This code already exists" });
    const now = new Date();
    const r = await col().insertOne({ ...doc, active: true, used: 0, createdAt: now, updatedAt: now });
    const saved = await col().findOne({ _id: r.insertedId });
    res.status(201).json({ data: shape(saved) });
  } catch (err) {
    console.error("admin offers create failed:", err.message);
    res.status(500).json({ message: "Could not create the offer" });
  }
});

// PATCH /api/admin/offers/:id   body: { active } to pause or resume, or the full offer to edit
router.patch("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Bad offer id" });
    const _id = new mongoose.Types.ObjectId(req.params.id);
    const b = req.body || {};
    let set;
    if (Object.keys(b).length === 1 && typeof b.active === "boolean") {
      set = { active: b.active };
    } else {
      const { doc, error } = clean(b);
      if (error) return res.status(400).json({ message: error });
      if (await col().findOne({ code: doc.code, _id: { $ne: _id } })) return res.status(409).json({ message: "This code already exists" });
      set = doc;
    }
    const r = await col().findOneAndUpdate({ _id }, { $set: { ...set, updatedAt: new Date() } }, { returnDocument: "after" });
    const saved = r && r.value !== undefined ? r.value : r;
    if (!saved) return res.status(404).json({ message: "Offer not found" });
    res.json({ data: shape(saved) });
  } catch (err) {
    console.error("admin offers update failed:", err.message);
    res.status(500).json({ message: "Could not update the offer" });
  }
});

// DELETE /api/admin/offers/:id
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Bad offer id" });
    const r = await col().deleteOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
    if (!r.deletedCount) return res.status(404).json({ message: "Offer not found" });
    res.json({ ok: true });
  } catch (err) {
    console.error("admin offers delete failed:", err.message);
    res.status(500).json({ message: "Could not delete the offer" });
  }
});

module.exports = router;

