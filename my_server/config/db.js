const { MongoClient } = require('mongodb');
const dns = require('dns');

// Google DNS configuration to prevent windows ECONNREFUSED issues on mongodb+srv
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const url = process.env.MONGODB_URI || 'mongodb+srv://admin1:123123123@cluster0.kwb0xy7.mongodb.net/group04_db?appName=Cluster0';
const dbName = 'group04_db';

let client;
let db;

const connect = async () => {
    try {
        client = new MongoClient(url);
        await client.connect();
        db = client.db(dbName);
        console.log('Kết nối MongoDB Atlas thành công bằng MongoClient!');
        return db;
    } catch (err) {
        console.error('Lỗi kết nối MongoDB Atlas qua MongoClient:', err);
        throw err;
    }
};

const getDb = () => db;

module.exports = { connect, getDb };
