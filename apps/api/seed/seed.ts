import "dotenv/config";
import mongoose from "mongoose";
import { Restaurant } from "../src/modules/restaurants/restaurant.model.js";

const uri = process.env.MONGO_URI;
if (!uri) throw new Error("MONGO_URI is missing from apps/api/.env");

// Prices are in paise (26000 = Rs 260).
type Dish = { name: string; description: string; priceInr: number; veg: boolean };
type Cuisine = { categories: string[]; dishes: Dish[] };

// The first seven restaurants are hand-written.
const samples = [
  {
    name: "Spice Route",
    slug: "spice-route",
    categories: ["North Indian", "Biryani"],
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
    categories: ["South Indian"],
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
    categories: ["Burgers", "Fast food"],
    city: "Ahmedabad",
    rating: 4.0,
    deliveryMinutes: 25,
    menu: [
      { name: "Classic Cheeseburger", description: "Beef patty, cheddar, pickles", priceInr: 21000, veg: false },
      { name: "Veggie Burger", description: "Crisp potato and pea patty", priceInr: 17000, veg: true },
    ],
  },
  {
    name: "Thali Express",
    slug: "thali-express",
    categories: ["Gujarati", "Thali"],
    city: "Ahmedabad",
    rating: 4.6,
    deliveryMinutes: 35,
    menu: [
      { name: "Gujarati Thali", description: "Dal, kadhi, two shaaks, rotli, rice, farsan", priceInr: 24900, veg: true },
      { name: "Dal Dhokli", description: "Wheat dumplings in spiced lentils", priceInr: 16000, veg: true },
    ],
  },
  {
    name: "Pizza Piazza",
    slug: "pizza-piazza",
    categories: ["Pizza", "Italian"],
    city: "Ahmedabad",
    rating: 4.1,
    deliveryMinutes: 30,
    menu: [
      { name: "Margherita Pizza", description: "Tomato, mozzarella, basil", priceInr: 32900, veg: true },
      { name: "Pepperoni Pizza", description: "Pepperoni, mozzarella, oregano", priceInr: 39900, veg: false },
    ],
  },
  {
    name: "Wok Street",
    slug: "wok-street",
    categories: ["Chinese"],
    city: "Ahmedabad",
    rating: 3.9,
    deliveryMinutes: 35,
    menu: [
      { name: "Hakka Noodles", description: "Stir-fried noodles, vegetables", priceInr: 21900, veg: true },
      { name: "Chilli Chicken", description: "Crisp chicken, peppers, soy glaze", priceInr: 27900, veg: false },
    ],
  },
  {
    name: "Pav Bhaji House",
    slug: "pav-bhaji-house",
    categories: ["Street food", "Gujarati"],
    city: "Ahmedabad",
    rating: 4.3,
    deliveryMinutes: 25,
    menu: [
      { name: "Butter Pav Bhaji", description: "Mashed vegetables, butter, two pav", priceInr: 16000, veg: true },
      { name: "Cheese Pav Bhaji", description: "Pav bhaji topped with melted cheese", priceInr: 18900, veg: true },
    ],
  },
];

// Dish templates. Each restaurant gets three dishes from its cuisine.
const CUISINES: Cuisine[] = [
  {
    categories: ["North Indian", "Curry"],
    dishes: [
      { name: "Dal Makhani", description: "Slow-cooked black lentils, butter, cream", priceInr: 18900, veg: true },
      { name: "Butter Chicken", description: "Tomato gravy, butter, tender chicken", priceInr: 26900, veg: false },
      { name: "Paneer Butter Masala", description: "Cottage cheese in rich tomato gravy", priceInr: 22900, veg: true },
      { name: "Tandoori Roti", description: "Whole wheat bread from the clay oven", priceInr: 2500, veg: true },
    ],
  },
  {
    categories: ["South Indian"],
    dishes: [
      { name: "Plain Dosa", description: "Thin crisp rice and lentil crepe", priceInr: 9000, veg: true },
      { name: "Rava Idli", description: "Semolina steamed cakes, coconut chutney", priceInr: 8000, veg: true },
      { name: "Medu Vada", description: "Crisp lentil fritters with sambar", priceInr: 9500, veg: true },
      { name: "Chicken Chettinad", description: "Chicken in a spiced Chettinad masala", priceInr: 25900, veg: false },
    ],
  },
  {
    categories: ["Gujarati", "Thali"],
    dishes: [
      { name: "Gujarati Thali", description: "Dal, kadhi, shaak, rotli, rice, farsan", priceInr: 24900, veg: true },
      { name: "Khaman Dhokla", description: "Steamed gram flour cake with tempering", priceInr: 8000, veg: true },
      { name: "Undhiyu", description: "Mixed winter vegetables, methi muthia", priceInr: 16900, veg: true },
      { name: "Sev Tameta", description: "Tomato curry topped with crunchy sev", priceInr: 11000, veg: true },
    ],
  },
  {
    categories: ["Chinese"],
    dishes: [
      { name: "Veg Fried Rice", description: "Wok-tossed rice with vegetables", priceInr: 17900, veg: true },
      { name: "Schezwan Noodles", description: "Spicy stir-fried noodles", priceInr: 19900, veg: true },
      { name: "Chilli Chicken", description: "Crisp chicken, peppers, soy glaze", priceInr: 27900, veg: false },
      { name: "Veg Manchurian", description: "Vegetable dumplings in tangy gravy", priceInr: 18900, veg: true },
    ],
  },
  {
    categories: ["Pizza", "Italian"],
    dishes: [
      { name: "Veggie Supreme Pizza", description: "Peppers, onion, olives, mozzarella", priceInr: 34900, veg: true },
      { name: "Paneer Pizza", description: "Spiced paneer, tomato, mozzarella", priceInr: 32900, veg: true },
      { name: "Chicken Tikka Pizza", description: "Tandoori chicken, onion, mozzarella", priceInr: 37900, veg: false },
      { name: "Pasta Alfredo", description: "Creamy white sauce, parmesan", priceInr: 27900, veg: true },
    ],
  },
  {
    categories: ["Burgers", "Fast food"],
    dishes: [
      { name: "Chicken Burger", description: "Crisp chicken fillet, mayo, lettuce", priceInr: 19900, veg: false },
      { name: "Aloo Tikki Burger", description: "Spiced potato patty, chutney", priceInr: 11900, veg: true },
      { name: "French Fries", description: "Salted and crisp, with peri peri", priceInr: 9900, veg: true },
      { name: "Chicken Wings", description: "Six wings, choice of sauce", priceInr: 22900, veg: false },
    ],
  },
  {
    categories: ["Biryani"],
    dishes: [
      { name: "Veg Biryani", description: "Basmati rice, vegetables, saffron", priceInr: 22900, veg: true },
      { name: "Mutton Biryani", description: "Slow dum mutton, long-grain rice", priceInr: 39900, veg: false },
      { name: "Egg Biryani", description: "Boiled egg, fragrant masala rice", priceInr: 19900, veg: false },
      { name: "Chicken 65", description: "Spicy fried chicken bites", priceInr: 21900, veg: false },
    ],
  },
  {
    categories: ["Street food"],
    dishes: [
      { name: "Pani Puri", description: "Crisp shells, spiced water, chutneys", priceInr: 6000, veg: true },
      { name: "Sev Puri", description: "Potato, onion, sev, tangy chutney", priceInr: 7000, veg: true },
      { name: "Dabeli", description: "Spiced potato bun, pomegranate, peanuts", priceInr: 6000, veg: true },
      { name: "Vada Pav", description: "Potato fritter in a soft bun", priceInr: 5000, veg: true },
    ],
  },
];

const PREFIXES = [
  "Royal", "Golden", "Silver", "Green", "Urban", "Sunset", "Maple", "Riverside", "Saffron", "Crown",
  "Lotus", "Coastal", "Mango", "Chai", "Tandoor", "Ember", "Olive", "Cedar", "Harbor", "Velvet",
];
const SUFFIXES = ["Kitchen", "Grill", "House", "Cafe", "Bistro", "Diner", "Corner", "Dhaba", "Eatery", "Table"];

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Deterministic: the same count always gives the same restaurants,
// so re-running the seed updates these rows instead of adding new ones.
function generatedRestaurants(count: number) {
  if (count > PREFIXES.length * SUFFIXES.length) throw new Error("Not enough name combinations");

  return Array.from({ length: count }, (_, i) => {
    const name = `${PREFIXES[i % PREFIXES.length]} ${SUFFIXES[Math.floor(i / PREFIXES.length) % SUFFIXES.length]}`;
    const cuisine = CUISINES[i % CUISINES.length];

    const menu = [0, 1, 2].map((k) => {
      const dish = cuisine.dishes[(i + k) % cuisine.dishes.length];
      return { ...dish, priceInr: dish.priceInr + ((i + k) % 3) * 500 };
    });

    return {
      name,
      slug: slugify(name),
      categories: cuisine.categories,
      city: "Ahmedabad",
      rating: Math.round((3.5 + ((i * 3) % 15) / 10) * 10) / 10,
      deliveryMinutes: 15 + ((i * 5) % 26),
      menu,
    };
  });
}

const all = [...samples, ...generatedRestaurants(200)];

const slugs = new Set(all.map((r) => r.slug));
if (slugs.size !== all.length) throw new Error("Duplicate slugs in seed data");

await mongoose.connect(uri);

for (const r of all) {
  await Restaurant.updateOne({ slug: r.slug }, { $set: r }, { upsert: true, strict: false });
}

console.log(`Seeded ${all.length} restaurants`);
await mongoose.disconnect();

