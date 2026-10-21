import "dotenv/config";
import mongoose from "mongoose";
import { Restaurant } from "../src/modules/restaurants/restaurant.model.js";

const uri = process.env.MONGO_URI;
if (!uri) throw new Error("MONGO_URI is missing from apps/api/.env");

const samples = [
  {
    name: "Spice Route",
    slug: "spice-route",
    cuisine: ["North Indian", "Biryani"],
    city: "Ahmedabad",
    rating: 4.5,
    deliveryMinutes: 30,
    menu: [
      { name: "Paneer Tikka", description: "Smoky grilled cottage cheese", priceInr: 26000, veg: true },
      { name: "Chicken Biryani", description: "Long-grain rice, slow dum", priceInr: 32000, veg: false },
      { name: "Garlic Naan", description: "Clay oven bread", priceInr: 6000, veg: true },
    ],
  },
  {
    name: "Dosa Corner",
    slug: "dosa-corner",
    cuisine: ["South Indian"],
    city: "Ahmedabad",
    rating: 4.2,
    deliveryMinutes: 20,
    menu: [
      { name: "Masala Dosa", description: "Crisp dosa with potato filling", priceInr: 12000, veg: true },
      { name: "Idli Sambar", description: "Steamed rice cakes, lentil stew", priceInr: 9000, veg: true },
    ],
  },
  {
    name: "Burger Lab",
    slug: "burger-lab",
    cuisine: ["Burgers", "Fast food"],
    city: "Ahmedabad",
    rating: 4.0,
    deliveryMinutes: 25,
    menu: [
      { name: "Classic Cheeseburger", description: "Beef patty, cheddar, pickles", priceInr: 21000, veg: false },
      { name: "Veggie Burger", description: "Crisp potato and pea patty", priceInr: 17000, veg: true },
    ],
  },
];

await mongoose.connect(uri);

for (const r of samples) {
  await Restaurant.updateOne({ slug: r.slug }, { $set: r }, { upsert: true });
}

console.log(`Seeded ${samples.length} restaurants`);
await mongoose.disconnect();
