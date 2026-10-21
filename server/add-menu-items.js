require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/biteverse';

const menus = {
  'Burger Lab': [
    ['Classic Veg Burger', 99],
    ['Classic Chicken Burger', 149],
    ['Double Cheese Burger', 199],
    ['Paneer Tikka Burger', 169],
    ['Aloo Tikki Burger', 89],
    ['Crispy Chicken Burger', 179],
    ['Spicy Chicken Burger', 189],
    ['Mushroom Swiss Burger', 199],
    ['BBQ Chicken Burger', 209],
    ['Egg Burger', 129],
    ['Peri Peri Burger', 169],
    ['Smash Burger', 219],
    ['Mexican Burger', 199],
    ['Crunchy Fish Burger', 209],
    ['Veg Cheese Burger', 119],
    ['Chicken Club Sandwich', 179],
    ['Veg Club Sandwich', 139],
    ['Grilled Chicken Wrap', 169],
    ['Paneer Wrap', 149],
    ['Veggie Wrap', 129],
    ['French Fries', 79],
    ['Peri Peri Fries', 99],
    ['Cheese Fries', 129],
    ['Onion Rings', 109],
    ['Chicken Nuggets', 149],
    ['Veg Nuggets', 119],
    ['Chicken Wings', 199],
    ['Coleslaw', 59],
    ['Chocolate Milkshake', 139],
    ['Strawberry Milkshake', 139],
    ['Vanilla Shake', 129],
    ['Cold Coffee', 119],
    ['Masala Coke', 69],
    ['Hash Brown', 79],
  ],
  'Dosa Corner': [
    ['Plain Dosa', 79],
    ['Masala Dosa', 99],
    ['Rava Dosa', 109],
    ['Onion Rava Dosa', 119],
    ['Paneer Dosa', 149],
    ['Cheese Dosa', 139],
    ['Mysore Masala Dosa', 129],
    ['Schezwan Dosa', 139],
    ['Podi Dosa', 99],
    ['Ghee Roast Dosa', 129],
    ['Set Dosa', 89],
    ['Neer Dosa', 99],
    ['Uttapam', 89],
    ['Onion Uttapam', 99],
    ['Tomato Uttapam', 99],
    ['Mini Idli Sambar', 79],
    ['Idli Sambar', 69],
    ['Medu Vada', 59],
    ['Masala Vada', 69],
    ['Vada Sambar', 79],
    ['Pongal', 89],
    ['Upma', 69],
    ['Kesari Bath', 59],
    ['Filter Coffee', 49],
    ['Masala Chai', 39],
    ['Lemon Soda', 59],
    ['Sweet Lassi', 79],
    ['Mango Lassi', 99],
    ['Sambar Rice', 99],
    ['Curd Rice', 89],
    ['Lemon Rice', 89],
    ['Tomato Rice', 89],
    ['Bisi Bele Bath', 109],
  ],
  'Spice Route': [
    ['Dal Tadka', 169],
    ['Dal Makhani', 189],
    ['Paneer Butter Masala', 249],
    ['Kadai Paneer', 239],
    ['Palak Paneer', 229],
    ['Shahi Paneer', 259],
    ['Paneer Tikka Masala', 249],
    ['Butter Chicken', 279],
    ['Chicken Tikka Masala', 269],
    ['Chicken Curry', 239],
    ['Kadai Chicken', 259],
    ['Mutton Rogan Josh', 349],
    ['Mutton Curry', 329],
    ['Chicken Biryani', 249],
    ['Veg Biryani', 199],
    ['Mutton Biryani', 329],
    ['Egg Biryani', 189],
    ['Jeera Rice', 129],
    ['Steamed Rice', 99],
    ['Plain Naan', 49],
    ['Butter Naan', 69],
    ['Garlic Naan', 89],
    ['Tandoori Roti', 35],
    ['Laccha Paratha', 79],
    ['Chicken Tikka', 259],
    ['Paneer Tikka', 229],
    ['Tandoori Chicken Half', 299],
    ['Malai Kofta', 239],
    ['Chana Masala', 179],
    ['Aloo Gobi', 169],
    ['Raita', 59],
    ['Gulab Jamun', 89],
    ['Kheer', 99],
  ],
};

async function main() {
  await mongoose.connect(uri);
  const col = mongoose.connection.db.collection('restaurants');

  for (const [restaurantName, items] of Object.entries(menus)) {
    const r = await col.findOne({ name: restaurantName });
    if (!r) {
      console.log('Not found: ' + restaurantName);
      continue;
    }

    const existing = (r.menu || []).map((m) => m.name);
    const toAdd = items
      .filter(([name]) => !existing.includes(name))
      .map(([name, price]) => ({ name, price }));

    if (toAdd.length === 0) {
      console.log(restaurantName + ': already has these items, nothing added.');
      continue;
    }

    await col.updateOne(
      { _id: r._id },
      { $push: { menu: { $each: toAdd } }, $set: { updatedAt: new Date() } }
    );
    console.log(restaurantName + ': added ' + toAdd.length + ' items.');
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
