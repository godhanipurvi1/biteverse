require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/biteverse';
const fixes = [
  { name: 'Burger Lab', categories: ['burgers'] },
  { name: 'Spice Route', categories: ['north-indian'] },
  { name: 'Dosa Corner', categories: ['south-indian'] },
];

async function main() {
  await mongoose.connect(uri);
  const col = mongoose.connection.db.collection('restaurants');

  for (const fix of fixes) {
    const res = await col.updateOne(
      { name: fix.name },
      { $set: { categories: fix.categories, updatedAt: new Date() } }
    );
    console.log(fix.name + ': matched ' + res.matchedCount + ', modified ' + res.modifiedCount);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
