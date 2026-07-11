const { ObjectId } = require('mongodb');

let db;
const init = (database) => { db = database; };

const collection = () => db.collection('liquidation');

const createLiquidation = async (data) => {
  const liquidations = collection();
  const newLiquidation = {
    userId: data.userId || null,
    fullname: data.fullname,
    phone: data.phone,
    email: data.email,
    address: data.address,
    books: data.books || [],
    shippingMethod: data.shippingMethod,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  const result = await liquidations.insertOne(newLiquidation);
  return { ...newLiquidation, _id: result.insertedId };
};

const getLiquidationsByUser = async (userId) => {
  const liquidations = collection();
  return await liquidations.find(
    { userId: userId },
    { projection: { 'books.image': 0 } }
  ).sort({ createdAt: -1 }).toArray();
};

const updateLiquidationStatus = async (id, status) => {
  const liquidations = collection();
  const result = await liquidations.updateOne(
    { _id: new ObjectId(id) },
    { $set: { status: status, updatedAt: new Date() } }
  );
  return result.modifiedCount > 0;
};

module.exports = {
  init,
  createLiquidation,
  getLiquidationsByUser,
  updateLiquidationStatus,
  collection
};
