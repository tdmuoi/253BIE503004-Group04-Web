const express = require('express');
const router = express.Router();
const { verifyAdminToken } = require('../middleware/adminMiddleware');
const adminController = require('../controllers/adminController');

const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');

// Disable auth middleware temporarily for development/testing if needed
// router.use(verifyAdminToken); 

// --- NEW ADMIN ENDPOINTS ---
router.get('/dashboard', adminController.getDashboardStats);
router.get('/orders-list', adminController.getOrders);
router.get('/orders/:id', adminController.getOrderDetails);
router.get('/returns', adminController.getReturns);
router.get('/customers', adminController.getCustomers);
router.get('/customers/:id', adminController.getCustomerDetails);

router.put('/returns/:id/status', adminController.updateLiquidationStatus);

// Helper generators for missing fields in MongoDB
const generateIsbn = (title) => {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  const isbnCode = Math.abs(hash).toString().substring(0, 10).padEnd(10, '0');
  return `978-604-${isbnCode[0]}-${isbnCode.substring(1, 6)}-${isbnCode[9]}`;
};

const generateCategory = (title) => {
  const categories = ['Kinh tế & Đầu tư', 'Kỹ năng sống', 'Văn học', 'Thiếu nhi', 'Lịch sử', 'Khoa học'];
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % categories.length;
  return categories[index];
};

const generateStock = (title) => {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  const stock = Math.abs(hash) % 180;
  return stock;
};

// --- EXISTING ENDPOINTS ---
router.get('/products', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { search, category, status, page = 1, limit = 10 } = req.query;

    const books = await db.collection('books').find({}).toArray();

    // Map each book with its fields & fallbacks
    const mappedProducts = books.map((b) => {
      const title = b.title || 'Sách';
      const stock = b.stock !== undefined ? parseInt(b.stock) : (generateStock(title));
      const categoryVal = b.category || generateCategory(title);
      const isbnVal = b.isbn || generateIsbn(title);
      
      let statusVal = 'Còn hàng';
      if (stock === 0) statusVal = 'Hết hàng';
      else if (stock < 15) statusVal = 'Sắp hết hàng';

      return {
        id: b._id.toString(),
        title,
        author: b.author || 'Tác giả',
        image: b.image || b.image_url || '',
        price: parseFloat(b.price_current || b.price || 0),
        price_old: parseFloat(b.price_old || 0),
        discount_percent: b.discount_percent || 0,
        isbn: isbnVal,
        category: categoryVal,
        stock,
        status: statusVal
      };
    });

    // Calculate Summary Stats
    const totalTitles = mappedProducts.length;
    const lowStockCount = mappedProducts.filter(p => p.stock > 0 && p.stock < 15).length;
    const outOfStockCount = mappedProducts.filter(p => p.stock === 0).length;

    // Apply filters
    let filtered = mappedProducts;
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(searchLower) || 
        p.isbn.toLowerCase().includes(searchLower)
      );
    }
    if (category && category !== 'All') {
      filtered = filtered.filter(p => p.category === category);
    }
    if (status && status !== 'All') {
      filtered = filtered.filter(p => p.status === status);
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    const paginated = filtered.slice(skip, skip + Number(limit));

    res.json({
      summary: {
        totalTitles,
        lowStockCount,
        outOfStockCount
      },
      products: paginated,
      total: filtered.length,
      page: Number(page),
      totalPages: Math.ceil(filtered.length / limit)
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Create product (admin)
// @route   POST /api/admin/products
router.post('/products', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { title, author, price, isbn, category, stock, image } = req.body;

    const newBook = {
      title,
      author,
      price_current: parseFloat(price) || 0,
      price_old: parseFloat(price) || 0,
      discount_percent: 0,
      isbn,
      category,
      stock: parseInt(stock) || 0,
      image,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('books').insertOne(newBook);
    res.json({ success: true, message: 'Thêm sản phẩm thành công', product: { ...newBook, id: result.insertedId.toString() } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Update product (admin)
// @route   PUT /api/admin/products/:id
router.put('/products/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { title, author, price, isbn, category, stock, image } = req.body;
    const { ObjectId } = require('mongodb');

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID không hợp lệ' });
    }

    const updateDoc = {
      title,
      author,
      price_current: parseFloat(price) || 0,
      isbn,
      category,
      stock: parseInt(stock) || 0,
      image,
      updatedAt: new Date()
    };

    const result = await db.collection('books').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateDoc }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    res.json({ success: true, message: 'Cập nhật sản phẩm thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Delete product (admin)
// @route   DELETE /api/admin/products/:id
router.delete('/products/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { id } = req.params;
    const { ObjectId } = require('mongodb');

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID không hợp lệ' });
    }

    const result = await db.collection('books').deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    res.json({ success: true, message: 'Xóa sản phẩm thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Get all users (admin)
// @route   GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await User.collection().find({}).toArray(); // Lấy tất cả user
    const usersWithoutPassword = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    res.json({ users: usersWithoutPassword });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Update user role (admin)
// @route   PUT /api/admin/users/:id/role
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['customer', 'admin', 'vip customer', 'normal customer'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const updated = await User.updateUserById(req.params.id, { role });
    if (!updated) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Notify clients
    console.log('Admin: Emitting userUpdated for userId:', req.params.id, 'with role:', role);
    req.app.get('io').emit('userUpdated', { userId: req.params.id, role });

    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Update user details (admin)
// @route   PUT /api/admin/users/:id
router.put('/users/:id', async (req, res) => {
  try {
    const updated = await User.updateUserById(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Notify clients
    console.log('Admin: Emitting userUpdated for userId (generic):', req.params.id);
    req.app.get('io').emit('userUpdated', { userId: req.params.id });

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Delete user (admin)
// @route   DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    const { ObjectId } = require('mongodb');
    const result = await User.collection().deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Notify clients
    req.app.get('io').emit('userUpdated', { userId: req.params.id, action: 'delete' });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Get all orders (admin) (Original route)
// @route   GET /api/admin/orders
router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.getAllOrders();
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Create order (admin)
// @route   POST /api/admin/orders
router.post('/orders', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { customerName, customerEmail, customerPhone, customerAddress, total, status = 'Pending', items } = req.body;
    
    // Generate order ID like #DH-EJ8YB
    const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
    const orderId = `#DH-${randomStr}`;

    const newOrder = {
      orderId,
      customerName,
      email: customerEmail,
      customerInfo: {
        fullname: customerName,
        email: customerEmail,
        phone: customerPhone,
        address: customerAddress
      },
      items: items || [],
      total: parseFloat(total) || 0,
      total_amount: parseFloat(total) || 0,
      status,
      date: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('orders').insertOne(newOrder);
    res.json({ success: true, message: 'Tạo đơn hàng thành công', order: { ...newOrder, id: result.insertedId.toString() } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Update order status (admin)
// @route   PUT /api/admin/orders/:id/status
router.put('/orders/:id/status', async (req, res) => {
  try {
    const { status, deliveryAgency } = req.body;
    const orderId = req.params.id; // Có thể là _id hoặc id custom

    const { ObjectId } = require('mongodb');
    let filter;
    try {
      filter = { _id: new ObjectId(orderId) };
    } catch (e) {
      filter = { id: orderId };
    }

    let updateFields = { updatedAt: new Date() };
    if (status !== undefined) updateFields.status = status;
    if (deliveryAgency !== undefined) updateFields.deliveryAgency = deliveryAgency;

    const result = await Order.collection().updateOne(filter, { $set: updateFields });

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Notify clients (specifically the customer whose order was updated)
    req.app.get('io').emit('orderUpdated', { orderId, status, deliveryAgency, by: 'admin' });

    // Fetch the updated order to get userId and display order ID
    const updatedOrder = await Order.collection().findOne(filter);
    if (updatedOrder && updatedOrder.userId) {
      try {
        let statusText = status;
        if (status === 'Processing') statusText = 'Đang đóng gói';
        else if (status === 'Shipping' || status === 'Shipped') statusText = 'Đang giao';
        else if (status === 'Delivered') statusText = 'Đã giao thành công';
        else if (status === 'Cancelled') statusText = 'Đã bị hủy';

        await req.app.locals.db.collection('notifications').insertOne({
          userId: updatedOrder.userId.toString(),
          title: 'Cập nhật trạng thái đơn hàng',
          content: `Đơn hàng #${updatedOrder.id || updatedOrder.orderId} của bạn đã chuyển sang trạng thái "${statusText}".`,
          type: 'order_status',
          read: false,
          createdAt: new Date()
        });
      } catch (e) {
        console.error('Failed to create customer status notification:', e);
      }
    }

    res.json({ message: 'Order details updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Thống kê đơn hàng và doanh thu theo chi nhánh (admin)
// @route   GET /api/admin/orders/agency-stats
router.get('/orders/agency-stats', async (req, res) => {
  try {
    const stats = await Order.collection().aggregate([
      {
        $group: {
          _id: '$deliveryAgency',
          count: { $sum: 1 },
          revenue: { $sum: '$total' }
        }
      },
      { $sort: { count: -1 } }
    ]).toArray();

    // Chuẩn hóa: null / undefined → "Chưa xác định"
    const normalized = stats.map(s => ({
      agency: s._id || 'Chưa xác định',
      count: s.count,
      revenue: s.revenue || 0
    }));

    res.json(normalized);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Get system settings (admin)
// @route   GET /api/admin/settings
router.get('/settings', async (req, res) => {
  try {
    const db = req.app.locals.db;
    let settings = await db.collection('settings').findOne({});
    
    if (!settings) {
      // Default settings
      settings = {
        language: 'Vietnamese',
        theme: 'light',
        vnpayConnected: true,
        momoConnected: false,
        freePreviewLimit: 10,
        watermarkText: 'Lightbooks Copy',
        encryptionLevel: 'enhanced',
        roles: [
          { roleName: 'Admin', assignedUsers: 3, accessLevel: 'Full Access', status: 'Active' },
          { roleName: 'Editor', assignedUsers: 8, accessLevel: 'Content Only', status: 'Active' },
          { roleName: 'Support', assignedUsers: 12, accessLevel: 'Limited', status: 'Inactive' }
        ]
      };
      await db.collection('settings').insertOne(settings);
    }
    
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @desc    Update system settings (admin)
// @route   POST /api/admin/settings
router.post('/settings', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { language, theme, vnpayConnected, momoConnected, freePreviewLimit, watermarkText, encryptionLevel, roles } = req.body;
    
    const updateDoc = {
      language,
      theme,
      vnpayConnected: !!vnpayConnected,
      momoConnected: !!momoConnected,
      freePreviewLimit: parseInt(freePreviewLimit) || 10,
      watermarkText: watermarkText || '',
      encryptionLevel: encryptionLevel || 'enhanced',
      roles: roles || [],
      updatedAt: new Date()
    };

    await db.collection('settings').updateOne(
      {},
      { $set: updateDoc },
      { upsert: true }
    );

    res.json({ success: true, message: 'Cập nhật cấu hình hệ thống thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
