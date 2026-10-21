import mongoose from "mongoose";
import { MenuItem } from "../modules/menu/menu-item.model";

const MONGO_URI = process.env.MONGO_URI ?? "mongodb://127.0.0.1:27017/biteverse";

// [name, category, price in rupees, isVeg]
type Dish = [string, string, number, boolean];

type Shop = {
  slug: string;
  name: string;
  cuisines: string[];
  rating: number;
  deliveryMinutes: number;
  priceForTwo: number; // rupees
  dishes: Dish[];
};

const SHOPS: Shop[] = [
  {
    slug: "paneer-tikka", name: "Paneer Tikka", cuisines: ["Indian"], rating: 4.5, deliveryMinutes: 35, priceForTwo: 300,
    dishes: [
      ["Paneer Tikka", "Starters", 220, true],
      ["Tandoori Chicken", "Starters", 280, false],
      ["Malai Paneer Tikka", "Starters", 240, true],
      ["Hara Bhara Kebab", "Starters", 180, true],
      ["Chicken Seekh Kebab", "Starters", 260, false],
      ["Paneer Butter Masala", "Mains", 240, true],
      ["Dal Makhani", "Mains", 200, true],
      ["Butter Chicken", "Mains", 280, false],
      ["Kadai Paneer", "Mains", 230, true],
      ["Garlic Naan", "Breads", 60, true],
    ],
  },
  {
    slug: "la-pinoz-pizza", name: "La Pinoz Pizza", cuisines: ["Italian", "Pizza"], rating: 4.4, deliveryMinutes: 32, priceForTwo: 400,
    dishes: [
      ["Margherita", "Pizza", 249, true],
      ["Farmhouse Pizza", "Pizza", 379, true],
      ["Peppy Paneer Pizza", "Pizza", 349, true],
      ["Veg Supreme", "Pizza", 399, true],
      ["Chicken Tikka Pizza", "Pizza", 429, false],
      ["Pepperoni Pizza", "Pizza", 449, false],
      ["Cheese Burst Pizza", "Pizza", 459, true],
      ["Garlic Bread", "Sides", 129, true],
      ["Pasta Arrabbiata", "Pasta", 279, true],
      ["Tiramisu", "Desserts", 199, true],
    ],
  },
  {
    slug: "burger-singh", name: "Burger Singh", cuisines: ["Fast Food", "Burgers"], rating: 4.6, deliveryMinutes: 30, priceForTwo: 350,
    dishes: [
      ["Classic Veg Burger", "Burgers", 129, true],
      ["Aloo Tikki Burger", "Burgers", 99, true],
      ["Paneer Burger", "Burgers", 159, true],
      ["Cheese Veg Burger", "Burgers", 149, true],
      ["Chicken Burger", "Burgers", 169, false],
      ["Spicy Chicken Burger", "Burgers", 189, false],
      ["Double Patty Burger", "Burgers", 249, false],
      ["French Fries", "Sides", 99, true],
      ["Peri Peri Fries", "Sides", 119, true],
      ["Chicken Nuggets", "Sides", 149, false],
    ],
  },
  {
    slug: "biryani-house", name: "Biryani House", cuisines: ["Biryani", "Indian"], rating: 4.5, deliveryMinutes: 40, priceForTwo: 350,
    dishes: [
      ["Chicken Dum Biryani", "Biryani", 280, false],
      ["Mutton Biryani", "Biryani", 380, false],
      ["Veg Biryani", "Biryani", 180, true],
      ["Paneer Biryani", "Biryani", 220, true],
      ["Egg Biryani", "Biryani", 220, false],
      ["Chicken Tikka Biryani", "Biryani", 320, false],
      ["Hyderabadi Biryani", "Biryani", 300, false],
      ["Mirchi ka Salan", "Sides", 60, true],
      ["Raita", "Sides", 50, true],
      ["Chicken 65", "Starters", 150, false],
    ],
  },
  {
    slug: "pasta-plaza", name: "Pasta Plaza", cuisines: ["Italian", "Pasta"], rating: 4.3, deliveryMinutes: 32, priceForTwo: 380,
    dishes: [
      ["Penne Alfredo", "Pasta", 299, true],
      ["Spaghetti Bolognese", "Pasta", 329, false],
      ["Penne Arrabbiata", "Pasta", 269, true],
      ["Lasagna", "Pasta", 349, false],
      ["Veg Lasagna", "Pasta", 319, true],
      ["Pesto Pasta", "Pasta", 299, true],
      ["Chicken Alfredo", "Pasta", 339, false],
      ["Mac and Cheese", "Pasta", 249, true],
      ["Garlic Bread", "Sides", 119, true],
      ["Tiramisu", "Desserts", 189, true],
    ],
  },
  {
    slug: "dosa-corner", name: "Dosa Corner", cuisines: ["South Indian"], rating: 4.4, deliveryMinutes: 28, priceForTwo: 200,
    dishes: [
      ["Masala Dosa", "Dosas", 120, true],
      ["Plain Dosa", "Dosas", 90, true],
      ["Mysore Masala Dosa", "Dosas", 140, true],
      ["Rava Dosa", "Dosas", 130, true],
      ["Paneer Dosa", "Dosas", 160, true],
      ["Chicken Dosa", "Dosas", 180, false],
      ["Idli Sambar", "Breakfast", 90, true],
      ["Medu Vada", "Breakfast", 80, true],
      ["Uttapam", "Breakfast", 110, true],
      ["Filter Coffee", "Drinks", 50, true],
    ],
  },
  {
    slug: "sushi-world", name: "Sushi World", cuisines: ["Japanese", "Continental"], rating: 4.7, deliveryMinutes: 40, priceForTwo: 500,
    dishes: [
      ["California Roll", "Sushi", 350, false],
      ["Veg Avocado Roll", "Sushi", 320, true],
      ["Salmon Nigiri", "Sushi", 280, false],
      ["Paneer Teriyaki Roll", "Sushi", 340, true],
      ["Chicken Teriyaki Bowl", "Bowls", 360, false],
      ["Dragon Roll", "Sushi", 420, false],
      ["Edamame", "Sides", 180, true],
      ["Miso Soup", "Sides", 120, true],
      ["Veg Gyoza", "Sides", 220, true],
      ["Chicken Gyoza", "Sides", 240, false],
    ],
  },
  {
    slug: "green-bowl", name: "Green Bowl", cuisines: ["Healthy Food", "Salad"], rating: 4.5, deliveryMinutes: 28, priceForTwo: 280,
    dishes: [
      ["Quinoa Power Bowl", "Bowls", 260, true],
      ["Grilled Chicken Salad", "Salads", 280, false],
      ["Caesar Salad", "Salads", 220, true],
      ["Hummus Bowl", "Bowls", 230, true],
      ["Tofu Stir Fry Bowl", "Bowls", 250, true],
      ["Avocado Toast", "Breakfast", 210, true],
      ["Protein Egg Bowl", "Bowls", 240, false],
      ["Berry Smoothie Bowl", "Bowls", 220, true],
      ["Sprouts Chaat", "Snacks", 150, true],
      ["Green Detox Juice", "Drinks", 130, true],
    ],
  },
  {
    slug: "surti-locho-house", name: "Surti Locho House", cuisines: ["Gujarati", "Thali"], rating: 4.7, deliveryMinutes: 28, priceForTwo: 250,
    dishes: [
      ["Gujarati Thali", "Thali", 250, true],
      ["Surti Locho", "Breakfast", 60, true],
      ["Undhiyu", "Mains", 180, true],
      ["Khandvi", "Snacks", 90, true],
      ["Dhokla", "Snacks", 70, true],
      ["Thepla", "Breads", 60, true],
      ["Sev Khamani", "Snacks", 80, true],
      ["Dal Dhokli", "Mains", 140, true],
      ["Kadhi Khichdi", "Mains", 150, true],
      ["Shrikhand", "Desserts", 80, true],
    ],
  },
  {
    slug: "sweet-tooth-studio", name: "Sweet Tooth Studio", cuisines: ["Cakes", "Desserts"], rating: 4.9, deliveryMinutes: 35, priceForTwo: 260,
    dishes: [
      ["Chocolate Truffle Cake", "Cakes", 150, true],
      ["Red Velvet Cake", "Cakes", 160, true],
      ["Black Forest Cake", "Cakes", 140, true],
      ["Blueberry Cheesecake", "Cakes", 180, true],
      ["Mango Mousse", "Desserts", 150, true],
      ["Gulab Jamun", "Desserts", 80, true],
      ["Rasmalai", "Desserts", 120, true],
      ["Brownie Sundae", "Desserts", 170, true],
      ["Cookie Jar", "Desserts", 90, true],
      ["Chocolate Lava Cake", "Desserts", 160, true],
    ],
  },
];

async function main() {
  await mongoose.connect(MONGO_URI);
  const restaurants = mongoose.connection.collection("restaurants");
  let total = 0;

  for (const shop of SHOPS) {
    await restaurants.updateOne(
      { slug: shop.slug },
      {
        $set: {
          name: shop.name,
          slug: shop.slug,
          cuisines: shop.cuisines,
          rating: shop.rating,
          deliveryMinutes: shop.deliveryMinutes,
          priceForTwoPaise: shop.priceForTwo * 100,
          isOpen: true,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );

    const doc = await restaurants.findOne({ slug: shop.slug }, { projection: { _id: 1 } });
    if (!doc) throw new Error(`Restaurant not saved: ${shop.slug}`);

    await MenuItem.bulkWrite(
      shop.dishes.map(([name, category, rupees, isVeg]) => ({
        updateOne: {
          filter: { restaurantId: doc._id, name },
          update: {
            $set: {
              restaurantSlug: shop.slug,
              category,
              pricePaise: rupees * 100,
              isVeg,
              isAvailable: true,
            },
          },
          upsert: true,
        },
      }))
    );

    total += shop.dishes.length;
    console.log(`${shop.name}: ${shop.dishes.length} dishes`);
  }

  console.log(`Done. ${total} dishes across ${SHOPS.length} restaurants.`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
