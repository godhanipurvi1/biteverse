const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ status: "ok", app: "biteverse", time: new Date().toISOString() });
});

module.exports = router;
