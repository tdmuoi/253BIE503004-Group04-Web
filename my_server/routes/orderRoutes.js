const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const { ObjectId } = require('mongodb');

// Hàm tạo mã đơn hàng ngẫu nhiên (ví dụ: #DH-93A1B)
const generateOrderId = () => {
    const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `#DH-${randomStr}`;
};

// Tạo đơn hàng mới (Hỗ trợ khách vãng lai - không cần đăng nhập)
router.post('/', async (req, res) => {
    try {
        const orderData = req.body;
        // Ưu tiên dùng user_id từ token nếu có (verifyToken có thể thêm vào route nếu cần), 
        // hoặc dùng user_id từ body
        const userId = req.body.user_id || null;
        let calculatedSubtotal = 0;

        console.log('[Order POST] Nhận user_id từ frontend:', userId);

        // 1. Tính toán lại giá tiền từ Database để bảo mật
        if (orderData.items && Array.isArray(orderData.items)) {
            for (let i = 0; i < orderData.items.length; i++) {
                const item = orderData.items[i];
                const qty = item.quantity || 1;

                if (item.product_id) {
                    // Thử tìm trong collection 'products' trước
                    let dbProduct = null;
                    try {
                        dbProduct = await Product.findById(item.product_id);
                    } catch (_) {}

                    // Nếu không có trong products, thử tìm trong 'books'
                    if (!dbProduct) {
                        try {
                            const booksCol = req.app.locals.db
                                ? req.app.locals.db.collection('books')
                                : null;
                            if (booksCol) {
                                dbProduct = await booksCol.findOne({ _id: new ObjectId(item.product_id) });
                            }
                        } catch (_) {}
                    }

                    if (dbProduct) {
                        const actualPrice = dbProduct.price_current || dbProduct.price || item.price || 0;
                        item.price = actualPrice;
                        calculatedSubtotal += actualPrice * qty;

                        // Cập nhật số lượng tồn kho (chỉ cho collection products)
                        try {
                            const currentStock = dbProduct.stock || dbProduct.quantity || 0;
                            if (currentStock >= qty) {
                                await Product.updateById(item.product_id, {
                                    stock: currentStock - qty,
                                    quantity: currentStock - qty
                                });
                            }
                        } catch (_) {}
                    } else {
                        // Không tìm thấy sản phẩm trong DB → dùng giá từ frontend
                        calculatedSubtotal += (item.price || 0) * qty;
                    }
                } else {
                    // Không có product_id → dùng giá frontend
                    calculatedSubtotal += (item.price || 0) * qty;
                }
            }
        }

        // 2. Gán lại các giá trị an toàn
        // Nếu calculatedSubtotal = 0 (tất cả sản phẩm không tìm được giá) → dùng total_amount frontend
        if (calculatedSubtotal === 0 && orderData.total_amount) {
            calculatedSubtotal = orderData.total_amount;
        }
        orderData.total_amount = calculatedSubtotal;
        orderData.final_amount = calculatedSubtotal + (orderData.shipping_fee || 0) - (orderData.discount_amount || 0);
        orderData.status = orderData.status || 'confirming';
        orderData.id = generateOrderId(); // Tạo mã hiển thị

        // 3. Xác định userId hợp lệ
        let safeUserId = null;
        if (userId) {
            try {
                safeUserId = new ObjectId(userId); // Lưu dạng ObjectId
                console.log('[Order POST] userId hợp lệ, lưu ObjectId:', safeUserId);
            } catch (_) {
                console.warn('[Order POST] userId không hợp lệ (không phải ObjectId):', userId);
                safeUserId = null;
            }
        } else {
            console.warn('[Order POST] Không có userId → đơn hàng khách vãng lai');
        }
        const createdOrder = await Order.createOrder(safeUserId, orderData);
        console.log('[Order POST] Đã lưu đơn hàng, userId trong DB:', createdOrder.userId);

        // 4. Xóa giỏ hàng trên DB nếu user đã đăng nhập
        if (safeUserId) {
            try {
                await Cart.deleteCart(safeUserId);
            } catch (_) {}
        }

        // Notify admin
        req.app.get('io').emit('orderCreated', { order: createdOrder });

        res.status(201).json(createdOrder);
    } catch (err) {
        console.error('Create order error:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Lấy danh sách đơn hàng của user
router.get('/', verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;
        console.log('[Order GET] Lấy đơn hàng cho userId:', userId, '| type:', typeof userId);
        const orders = await Order.getOrdersByUserId(userId);
        console.log('[Order GET] Tìm thấy', orders.length, 'đơn hàng');
        res.json({ orders });
    } catch (err) {
        console.error('Get orders error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Lấy 1 đơn hàng cụ thể
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const orderId = req.params.id;
        const order = await Order.findOrderById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
        }

        // Kiểm tra xem đơn hàng này có phải của user đang đăng nhập không
        if (String(order.userId) !== String(userId)) {
            return res.status(403).json({ message: 'Bạn không có quyền xem đơn hàng này.' });
        }

        res.json({ order });
    } catch (err) {
        console.error('Get single order error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Hủy đơn hàng (nếu đang pending)
router.patch('/:id/cancel', verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const orderId = req.params.id; // order.id (VD: '#DH-20240301')

        const result = await Order.cancelOrder(orderId, userId);
        if (result.modifiedCount === 0) {
            return res.status(400).json({ message: 'Không thể hủy đơn hàng này (không tồn tại hoặc đã được xử lý).' });
        }

        // Notify admin that order was cancelled by user
        req.app.get('io').emit('orderUpdated', { orderId, status: 'canceled', by: 'user' });

        res.json({ message: 'Hủy đơn hàng thành công.' });
    } catch (err) {
        console.error('Cancel order error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;