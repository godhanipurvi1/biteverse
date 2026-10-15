require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Restaurant = require("../models/Restaurant");
const { RESTAURANTS } = require("./restaurantsSeedData");

async function seed() {
  await connectDB();

  console.log(`Seeding ${RESTAURANTS.length} restaurants...`);
  await Restaurant.deleteMany({});
  await Restaurant.insertMany(RESTAURANTS);

  console.log("Done. Restaurants collection populated.");
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});