require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/biteverse';
const fixes = [
  { name: 'Paneer Tikka', price: 229 },
  { name: 'Chicken Biryani', price: 249 },
  { name: 'Garlic Naan', price: 89 },
];

async function main() {
  await mongoose.connect(uri);
  const col = mongoose.connection.db.collection('restaurants');

  for (const fix of fixes) {
    const res = await col.updateOne(
      { name: 'Spice Route' },
      { $set: { 'menu.$[item].price': fix.price } },
      { arrayFilters: [{ 'item.name': fix.name, 'item.price': null }] }
    );
    console.log('Spice Route: ' + fix.name + ' -> ' + fix.price + ': modified ' + res.modifiedCount);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
