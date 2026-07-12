const { ObjectId } = require('mongodb');

let db;
const init = (database) => { db = database; };

const collection = () => db.collection('personalBooks');

const createPersonalBook = async (bookData) => {
  const books = collection();
  const newBook = {
    userId: bookData.userId,
    title: bookData.title,
    author: bookData.author,
    image: bookData.image || '',
    favorite: bookData.favorite !== undefined ? bookData.favorite : true,
    read: bookData.read !== undefined ? bookData.read : false,
    ebook: bookData.ebook !== undefined ? bookData.ebook : false,
    bookId: bookData.bookId || null,
    createdAt: new Date()
  };
  const result = await books.insertOne(newBook);
  return { ...newBook, _id: result.insertedId };
};

const getPersonalBooksByUser = async (userId) => {
  const books = collection();
  return await books.find({ userId: userId }).sort({ createdAt: -1 }).toArray();
};

const deletePersonalBook = async (id, userId) => {
  const books = collection();
  const result = await books.deleteOne({ _id: new ObjectId(id), userId: userId });
  return result.deletedCount > 0;
};

module.exports = {
  init,
  createPersonalBook,
  getPersonalBooksByUser,
  deletePersonalBook,
  collection
};
