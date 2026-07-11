const express = require('express');
const router = express.Router();
const Liquidation = require('../models/Liquidation');
const { verifyToken } = require('../middleware/authMiddleware');
const { ObjectId } = require('mongodb');

// Tạo yêu cầu thanh lý mới (Y hệt pattern order - nhận JSON thuần, hỗ trợ khách vãng lai)
router.post('/', async (req, res) => {
    try {
        const liquidationData = req.body;
        const userId = req.body.user_id || null;

        console.log('[Liquidation POST] Nhận user_id từ frontend:', userId);
        console.log('[Liquidation POST] Body:', JSON.stringify(req.body));

        if (!liquidationData.fullname || !liquidationData.phone || !liquidationData.email || !liquidationData.address) {
            return res.status(400).json({ error: 'Thiếu thông tin liên hệ bắt buộc' });
        }

        if (!liquidationData.books || !Array.isArray(liquidationData.books) || liquidationData.books.length === 0) {
            return res.status(400).json({ error: 'Cần ít nhất một cuốn sách' });
        }

        const newLiquidation = await Liquidation.createLiquidation({
            userId,
            fullname: liquidationData.fullname,
            phone: liquidationData.phone,
            email: liquidationData.email,
            address: liquidationData.address,
            books: liquidationData.books,
            shippingMethod: liquidationData.shippingMethod || 'postoffice'
        });

        console.log('[Liquidation POST] Đã lưu yêu cầu thanh lý, _id:', newLiquidation._id);
        res.status(201).json(newLiquidation);
    } catch (err) {
        console.error('[Liquidation POST] Error:', err);
        res.status(500).json({ error: 'Lỗi server', details: err.message });
    }
});

// Lấy danh sách yêu cầu thanh lý của user (Y hệt pattern order GET)
router.get('/my-requests', verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;
        console.log('[Liquidation GET] Lấy yêu cầu cho userId:', userId);
        const liquidations = await Liquidation.getLiquidationsByUser(userId.toString());
        console.log('[Liquidation GET] Tìm thấy', liquidations.length, 'yêu cầu');
        res.json(liquidations);
    } catch (err) {
        console.error('[Liquidation GET] Error:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Lấy chi tiết 1 yêu cầu thanh lý (kèm đầy đủ hình ảnh)
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const liquidationId = req.params.id;
        console.log('[Liquidation GET Detail] ID:', liquidationId, 'cho user:', userId);

        const liquidationCol = Liquidation.collection();
        const request = await liquidationCol.findOne({
            _id: new ObjectId(liquidationId),
            userId: userId.toString()
        });

        if (!request) {
            return res.status(404).json({ error: 'Không tìm thấy yêu cầu thanh lý hoặc không có quyền truy cập.' });
        }

        res.json(request);
    } catch (err) {
        console.error('[Liquidation GET Detail] Error:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

module.exports = router;
