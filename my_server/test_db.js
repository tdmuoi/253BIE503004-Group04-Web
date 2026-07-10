const { MongoClient } = require('mongodb');
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const url = 'mongodb+srv://admin1:123123123@cluster0.kwb0xy7.mongodb.net/group04_db?appName=Cluster0';

async function run() {
    const client = new MongoClient(url);
    try {
        await client.connect();
        const db = client.db('group04_db');
        const collections = await db.listCollections().toArray();
        console.log("Collections:", collections.map(c => c.name));
        
        const books = await db.collection('books').find({}).limit(1).toArray();
        console.log("Books sample:", JSON.stringify(books, null, 2));
        
        const products = await db.collection('products').find({}).limit(1).toArray();
        console.log("Products sample:", JSON.stringify(products, null, 2));

    } finally {
        await client.close();
    }
}
run();
