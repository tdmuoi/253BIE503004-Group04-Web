/**
 * Script gán đơn hàng test (userId:null) vào user hiện có
 */
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8','8.8.4.4']);
const { MongoClient, ObjectId } = require('mongodb');
const uri = 'mongodb+srv://admin1:123123123@cluster0.kwb0xy7.mongodb.net/group04_db?appName=Cluster0';
const client = new MongoClient(uri);

client.connect().then(async () => {
  const db = client.db('group04_db');
  
  console.log('=== USERS HIỆN CÓ ===');
  const users = await db.collection('users').find({}).toArray();
  users.forEach((u, i) => {
    console.log(`[${i}] _id: ${u._id.toString()} | email: ${u.email} | username: ${u.username}`);
  });
  
  // Gán đơn hàng userId=null vào user đầu tiên (để test)
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
  }
  
  await client.close();
}).catch(e => console.error('ERROR:', e.message));
