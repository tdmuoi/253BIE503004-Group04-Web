const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');

// Get all notifications for current user (or admin)
router.get('/', verifyToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const userId = req.user._id || req.user.id;
    const isAdmin = req.user.role === 'admin';
    const roleQuery = req.query.role;
    
    let query;
    if (isAdmin && roleQuery === 'admin') {
      // Admin sees notifications targeted to 'admin'
      query = { userId: 'admin' };
    } else {
      // Regular user sees notifications targeted to their userId
      query = { userId: userId.toString() };
    }

    const notifications = await db.collection('notifications')
      .find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark all notifications as read
router.post('/read-all', verifyToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const userId = req.user._id || req.user.id;
    const isAdmin = req.user.role === 'admin';
    const roleQuery = req.query.role;

    let query;
    if (isAdmin && roleQuery === 'admin') {
      query = { userId: 'admin' };
    } else {
      query = { userId: userId.toString() };
    }

    await db.collection('notifications').updateMany(
      query,
      { $set: { read: true } }
    );

    res.json({ success: true, message: 'Đánh dấu đã đọc tất cả thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper for seeding some initial mock notifications if collection is empty
router.get('/seed', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const count = await db.collection('notifications').countDocuments();
    if (count === 0) {
      const mockNotifications = [
        {
          userId: 'admin',
          title: 'Đơn hàng mới chờ duyệt',
          content: 'Đơn hàng #DH-K84F2 vừa được tạo bởi Nguyễn Anh Thư và đang chờ bạn phê duyệt.',
          type: 'order_new',
          read: false,
          createdAt: new Date(Date.now() - 3600000 * 2) // 2 hours ago
        },
        {
          userId: 'admin',
          title: 'Yêu cầu thanh lý mới',
          content: 'Độc giả Trần Văn Hùng vừa gửi một yêu cầu thanh lý sách cũ "Đắc Nhân Tâm".',
          type: 'liquidation_new',
          read: false,
          createdAt: new Date(Date.now() - 3600000 * 24) // 1 day ago
        }
      ];
      await db.collection('notifications').insertMany(mockNotifications);
    }
    res.json({ success: true, message: 'Seeded successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
