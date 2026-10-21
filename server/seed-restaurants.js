require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/biteverse';

const sample = [
  { name: 'Surti Locho House', cuisine: 'Gujarati, Thali', rating: 4.7, category: 'thali', min: 25, max: 30, cost: 250, offer: '20% off' },
  { name: 'Slice Society', cuisine: 'Pizza, Italian', rating: 4.5, category: 'pizza', min: 30, max: 35, cost: 400, offer: 'Free delivery' },
  { name: 'Dum Biryani Club', cuisine: 'Biryani, Mughlai', rating: 4.6, category: 'biryani', min: 35, max: 40, cost: 350, offer: '15% off' },
  { name: 'Patty Lane', cuisine: 'Burgers, Fries', rating: 4.4, category: 'burgers', min: 20, max: 25, cost: 300, offer: 'Buy 1 get 1' },
  { name: 'Noodle Nest', cuisine: 'Chinese, Hakka', rating: 4.3, category: 'chinese', min: 25, max: 30, cost: 320, offer: '10% off' },
  { name: 'Green Bowl Co.', cuisine: 'Salads, Bowls', rating: 4.8, category: 'healthy', min: 20, max: 25, cost: 280, offer: 'Free delivery' },
  { name: 'Sweet Tooth Studio', cuisine: 'Cakes, Desserts', rating: 4.9, category: 'desserts', min: 30, max: 40, cost: 260, offer: '25% off' },
  { name: 'Tandoor Tales', cuisine: 'North Indian, Tandoor', rating: 4.5, category: 'biryani', min: 35, max: 45, cost: 450, offer: '20% off' },
];

async function main() {
  await mongoose.connect(uri);
  const col = mongoose.connection.db.collection('restaurants');

  const existing = await col.countDocuments();
  if (existing > 0) {
    console.log('Not inserting. restaurants already has ' + existing + ' documents.');
    await mongoose.disconnect();
    return;
  }

  const now = new Date();
  const docs = sample.map((r) => ({
    name: r.name,
    cuisine: r.cuisine,
    rating: r.rating,
    isOpen: true,
    categories: [r.category],
    deliveryMinutes: { min: r.min, max: r.max },
    costForTwo: r.cost,
    offerLabel: r.offer,
    menu: [{ name: 'House special', price: r.cost / 2 }],
    createdAt: now,
    updatedAt: now,
  }));

  const result = await col.insertMany(docs);
  console.log('Inserted ' + result.insertedCount + ' restaurants.');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
