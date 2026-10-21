require('dotenv').config();
const mongoose = require('mongoose');
const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/biteverse';

function isBlank(p) {
  return p === undefined || p === null || p === '' || (typeof p === 'number' && (isNaN(p) || p <= 0));
}

(async () => {
  await mongoose.connect(uri);
  const docs = await mongoose.connection.db.collection('restaurants').find({}).toArray();
  console.log('=== MENU COUNTS ===');
  for (const r of docs) {
    const menu = r.menu || [];
    console.log(r.name + ': ' + menu.length + ' items, blank prices: ' + menu.filter(m => isBlank(m.price)).length);
  }
  console.log('\n=== BLANK-PRICE ITEMS AND "dosha"/test entries ===');
  for (const r of docs) {
    (r.menu || []).forEach((m, i) => {
      if (isBlank(m.price) || /dosha|test/i.test(m.name || '')) {
        console.log(JSON.stringify({ restaurant: r.name, index: i, _id: String(m._id), name: m.name, price: m.price, keys: Object.keys(m) }));
      }
    });
  }
  console.log('\n=== BURGER LAB PRICE RANGE (for suggesting the two missing prices) ===');
  const bl = docs.find(r => r.name === 'Burger Lab');
  if (bl) {
    bl.menu.filter(m => !isBlank(m.price) && /burger/i.test(m.name)).forEach(m => console.log(m.name + ' - ' + m.price));
  }
  await mongoose.disconnect();
})().catch(e => { console.error(e); process.exit(1); });
