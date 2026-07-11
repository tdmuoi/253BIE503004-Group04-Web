const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8','8.8.4.4']);
const { MongoClient, ObjectId } = require('mongodb');
const uri = 'mongodb+srv://admin1:123123123@cluster0.kwb0xy7.mongodb.net/group04_db?appName=Cluster0';
const client = new MongoClient(uri);

client.connect().then(async () => {
  const db = client.db('group04_db');
  
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
  // Thử match đơn hàng với user
  for (const order of orders) {
    if (order.userId) {
      const matchUser = users.find(u => u._id.toString() === order.userId.toString());
      console.log('Order userId:', order.userId.toString(), '→ match user:', matchUser ? matchUser.email : 'KHÔNG KHỚP');
    } else {
      console.log('Order userId: null → không thể match với user nào');
    }
  }

  await client.close();
}).catch(e => console.error('ERROR:', e.message));
