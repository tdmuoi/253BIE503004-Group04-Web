// import_old_book.js
// Chạy: node import_old_book.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const { MongoClient } = require('mongodb');
const fs = require('fs');

const uri = process.env.DB_URL;

// Sửa đường dẫn trỏ tới file dữ liệu sách cũ (old_books.json)
const jsonPath = path.join(__dirname, '..', '..', 'my-app', 'public', 'data', 'old_books.json');

async function importOldBooks() {
  if (!uri) {
    console.error('Thiếu DB_URL trong file .env');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Đã kết nối MongoDB Atlas');

    const dbName = 'group04_db';
    const collectionName = 'old_books';  // Đổi collection thành 'old_books' để không ghi đè sách mới

    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const raw = fs.readFileSync(jsonPath, 'utf-8');
    const books = JSON.parse(raw);

    // Xóa tất cả sách cũ TRONG COLLECTION 'old_books' trước khi nạp để tránh trùng lặp dữ liệu khi chạy lại script.
    // LƯU Ý: Lệnh này chỉ xóa dữ liệu trong collection 'old_books', KHÔNG ảnh hưởng đến collection 'books' (sách mới).
    await collection.deleteMany({});
    console.log('Đã làm sạch dữ liệu cũ trong collection old_books');

    // Nếu bạn muốn giữ lại dữ liệu cũ đã có sẵn trong MongoDB và chỉ thêm dữ liệu mới mà không xóa gì cả, 
    // hãy comment hoặc xóa dòng `await collection.deleteMany({});` ở trên đi nhé.

    const result = await collection.insertMany(books);
    console.log(`Đã insert ${result.insertedCount} documents vào ${dbName}.${collectionName}`);
  } catch (err) {
    console.error('Lỗi:', err);
  } finally {
    await client.close();
  }
}

importOldBooks();