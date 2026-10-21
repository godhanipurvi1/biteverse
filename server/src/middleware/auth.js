const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) throw new Error("JWT_SECRET missing or too short in .env");
  return s;
}

function signToken(customerId) {
  return jwt.sign({ sub: String(customerId) }, secret(), { algorithm: "HS256", expiresIn: "30d" });
}

function readToken(req) {
  const h = req.headers.authorization || "";
  return h.startsWith("Bearer ") ? h.slice(7).trim() : "";
}

// Requires a valid token. Sets req.customerId.
function requireAuth(req, res, next) {
  const token = readToken(req);
  if (!token) return res.status(401).json({ message: "Please log in" });
  try {
    const p = jwt.verify(token, secret(), { algorithms: ["HS256"] });
    if (!mongoose.isValidObjectId(p.sub)) throw new Error("bad sub");
    req.customerId = p.sub;
    next();
  } catch {
    res.status(401).json({ message: "Your session has expired. Please log in again." });
  }
}

// Sets req.customerId if a valid token is sent, otherwise carries on as a guest.
function optionalAuth(req, res, next) {
  const token = readToken(req);
  if (token) {
    try {
      const p = jwt.verify(token, secret(), { algorithms: ["HS256"] });
      if (mongoose.isValidObjectId(p.sub)) req.customerId = p.sub;
    } catch {
      // Invalid token on a guest-allowed route: treat as guest.
    }
  }
  next();
}

module.exports = { requireAuth, optionalAuth, signToken };
