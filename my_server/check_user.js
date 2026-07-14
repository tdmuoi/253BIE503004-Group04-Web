const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const { MongoClient } = require('mongodb');

async function run() {
    const client = new MongoClient('mongodb+srv://admin1:123123123@cluster0.kwb0xy7.mongodb.net/group04_db?appName=Cluster0');
    try {
        await client.connect();
        const db = client.db('group04_db');
        const users = await db.collection('users').find({}).toArray();
        console.log('Users in DB:');
        users.forEach(u => {
            console.log(`- Username: ${u.username}, Email: ${u.email}, Avatar length: ${u.avatar ? u.avatar.length : 0}, Avatar preview: ${u.avatar ? u.avatar.substring(0, 50) : 'none'}`);
        });
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}
run();
