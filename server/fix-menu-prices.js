require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/biteverse';

const priceFixes = [
  { id: '6ad87739e8393c02361adc7b', price: 149, label: 'Burger Lab: Classic Cheeseburger' },
  { id: '6ad87739e8393c02361adc7c', price: 119, label: 'Burger Lab: Veggie Burger' },
  { id: '6ad87739e8393c02361adc79', price: 99, label: 'Dosa Corner: Masala Dosa' },
  { id: '6ad87739e8393c02361adc7a', price: 69, label: 'Dosa Corner: Idli Sambar' },
];
const removeId = '6ad8b186999b5a0ca0e18feb'; // Dosa Corner: dosha

async function main() {
  await mongoose.connect(uri);
  const col = mongoose.connection.db.collection('restaurants');
  const ObjectId = mongoose.Types.ObjectId;

  for (const fix of priceFixes) {
    const res = await col.updateOne(
      { 'menu._id': new ObjectId(fix.id) },
      { $set: { 'menu.$[item].price': fix.price } },
      { arrayFilters: [{ 'item._id': new ObjectId(fix.id) }] }
    );
    console.log(fix.label + ': matched ' + res.matchedCount + ', modified ' + res.modifiedCount);
  }

  const del = await col.updateOne(
    { 'menu._id': new ObjectId(removeId) },
    { $pull: { menu: { _id: new ObjectId(removeId) } } }
  );
  console.log('Dosa Corner: removed "dosha": modified ' + del.modifiedCount);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
