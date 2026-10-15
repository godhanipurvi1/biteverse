const express = require("express");

const router = express.Router();

// POST /api/contact  { name, email, subject, message }
// No dedicated model for this — logs it server-side. Swap in a Contact
// model + email/notification service later if you want persistence.
router.post("/", async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ message: "name, email and message are required" });
  }

  console.log("New contact message:", { name, email, subject, message });
  res.status(201).json({ message: "Thanks — we'll get back to you soon." });
});

module.exports = router;