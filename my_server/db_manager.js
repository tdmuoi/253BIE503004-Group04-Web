const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const { MongoClient, ObjectId } = require('mongodb');

const url = process.env.MONGODB_URI || 'mongodb+srv://admin1:123123123@cluster0.kwb0xy7.mongodb.net/group04_db?appName=Cluster0';
const dbName = 'group04_db';

const action = process.argv[2] || 'test'; // 'test' | 'debug' | 'fix'

async function run() {
    const client = new MongoClient(url);
    try {
        await client.connect();
        const db = client.db(dbName);
        console.log(`[DB Manager] Connected successfully. Action: ${action.toUpperCase()}\n`);

        if (action === 'test') {
            // Từ test_db.js
            const collections = await db.listCollections().toArray();
            console.log("Collections:", collections.map(c => c.name));
            
            const books = await db.collection('books').find({}).limit(1).toArray();
            console.log("Books sample:", JSON.stringify(books, null, 2));
            
            const products = await db.collection('products').find({}).limit(1).toArray();
            console.log("Products sample:", JSON.stringify(products, null, 2));

        } else if (action === 'debug') {
            // Từ debug_orders.js
            console.log('=== TẤT CẢ USERS ===');
            const users = await db.collection('users').find({}).toArray();
            users.forEach(u => {
                console.log('_id:', u._id.toString(), '| email:', u.email, '| phone:', u.phone, '| hasPassword:', !!(u.password && u.password.length > 0));
            });

            console.log('\n=== TẤT CẢ ORDERS ===');
            const orders = await db.collection('orders').find({}).toArray();
            orders.forEach(o => {
                console.log('_id:', o._id.toString(), '| userId:', o.userId, '| status:', o.status);
            });

            console.log('\n=== KIỂM TRA MATCH ===');
            for (const order of orders) {
                if (order.userId) {
                    const matchUser = users.find(u => u._id.toString() === order.userId.toString());
                    console.log('Order userId:', order.userId.toString(), '→ match user:', matchUser ? matchUser.email : 'KHÔNG KHỚP');
                } else {
                    console.log('Order userId: null → không thể match với user nào');
                }
            }

        } else if (action === 'fix') {
            // Từ fix_orders.js
            console.log('=== USERS HIỆN CÓ ===');
            const users = await db.collection('users').find({}).toArray();
            users.forEach((u, i) => {
                console.log(`[${i}] _id: ${u._id.toString()} | email: ${u.email} | username: ${u.username}`);
            });
            
            if (users.length > 0) {
                const testUser = users[0];
                const result = await db.collection('orders').updateMany(
                    { userId: null },
                    { $set: { userId: testUser._id, status: 'confirming', updatedAt: new Date() } }
                );
                console.log(`\nĐã gán ${result.modifiedCount} đơn hàng vào user: ${testUser.email} (${testUser._id})`);
                
                console.log('\n=== XÁC NHẬN ===');
                const orders = await db.collection('orders').find({ userId: testUser._id }).toArray();
                console.log('Đơn hàng của user này:', orders.length);
                orders.forEach(o => {
                    console.log('  - Order', o._id.toString(), '| status:', o.status, '| final_amount:', o.final_amount);
                });
            } else {
                console.log('Không tìm thấy user nào để gán đơn hàng.');
            }
        } else {
            console.log(`Unknown action: ${action}. Use: test, debug, or fix`);
        }

    } catch (e) {
        console.error('ERROR:', e.message);
    } finally {
        await client.close();
    }
}

run()