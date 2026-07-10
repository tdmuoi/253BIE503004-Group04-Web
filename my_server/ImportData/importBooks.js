// importBooks.js
// Chạy: node importBooks.js
require('dotenv').config();
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Lấy connection string từ .env (biến DB_URL)
const uri = process.env.DB_URL;

// Đường dẫn tới books.json (my_server và my-app là 2 thư mục anh em)
const jsonPath = path.join(__dirname, '..', 'my-app', 'public', 'data', 'books.json');

async function importBooks() {
  if (!uri) {
    console.error('Thiếu DB_URL trong file .env');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Đã kết nối MongoDB Atlas');

    const dbName = 'group04_db';     // tên database, đặt tùy ý
    const collectionName = 'books';  // tên collection, đặt tùy ý

    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const raw = fs.readFileSync(jsonPath, 'utf-8');
    const books = JSON.parse(raw);

    // Xóa tất cả các sách cũ trước khi import để tránh trùng lặp dữ liệu
    await collection.deleteMany({});
    console.log('Đã xóa các books cũ trong database');

    const result = await collection.insertMany(books);
    console.log(`Đã insert ${result.insertedCount} documents vào ${dbName}.${collectionName}`);
  } catch (err) {
    console.error('Lỗi:', err);
  } finally {
    await client.close();
  }
}

importBooks();