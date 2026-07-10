require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');

const app = express();
const port = 3002;

// Secrets
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(morgan('combined'));
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (origin.startsWith('http://localhost:')) {
            return callback(null, true);
        }
        callback(null, true);
    },
    credentials: true
}));
app.use(express.json());

// Setup mock socket.io helper to prevent controller crashes if socket.io is not installed
app.set('io', {
    emit: (event, data) => {
        console.log(`[SocketMock] Event emitted: ${event}`, data);
    }
});

// Connect DB
const dbModule = require('./config/db');

// Import models to initialize
const User = require('./models/User');
const Otp = require('./models/Otp');
const Product = require('./models/Product');
const Order = require('./models/Order');
const Agency = require('./models/Agency');
const Blog = require('./models/Blog');
const Cart = require('./models/Cart');
const Contact = require('./models/Contact');
const Promotion = require('./models/Promotion');
const Review = require('./models/Review');

const accountJsonPath = path.join(__dirname, 'account.json');

// Initialize database native connection and models
let db;
async function startServer() {
    try {
        db = await dbModule.connect();

        // Drop unique index on phone to allow multiple social users with empty phone properties
        try {
            await db.collection('users').dropIndex('phone_1');
            console.log('Đã gỡ bỏ unique index trên trường phone của collection users.');
        } catch (err) {
            // Index may not exist or is already dropped
        }
        
        // Initialize all model DB instances
        User.init(db);
        Otp.init(db);
        Product.init(db);
        Order.init(db);
        Agency.init(db);
        Blog.init(db);
        Cart.init(db);
        Contact.init(db);
        Promotion.init(db);
        Review.init(db);

        // Load Routes
        const authRoutes = require('./routes/authRoutes');
        const forgotPasswordRoutes = require('./routes/forgotPasswordRoutes');
        const orderRoutes = require('./routes/orderRoutes');
        const { productsRouter, blogRouter, reviewsRouter } = require('./routes/productBlogReviewsRoutes');
        const promotionRoutes = require('./routes/promotionRoutes');
        const contactRoutes = require('./routes/contactRoutes');
        const cartRoutes = require('./routes/cartRoutes');
        const agencyRoutes = require('./routes/agencyRoutes');
        const adminRoutes = require('./routes/adminRoutes');

        // Initialize agencyRoutes db instance
        agencyRoutes.init(db);

        // Mount structured routes
        app.use('/api/auth', authRoutes);
        app.use('/api/auth', forgotPasswordRoutes);
        app.use('/api/orders', orderRoutes);
        app.use('/api/products', productsRouter);
        app.use('/api/blog', blogRouter);
        app.use('/api/reviews', reviewsRouter);
        app.use('/api/promotions', promotionRoutes);
        app.use('/api/contacts', contactRoutes);
        app.use('/api/carts', cartRoutes);
        app.use('/api/agencies', agencyRoutes.router); // Corrected to mount .router
        app.use('/api/admin', adminRoutes);

        // --- Backward Compatibility Router Aliases ---
        const { login, register, socialLogin } = require('./controllers/authController');
        app.post('/api/login', login);
        app.post('/api/register', register);
        app.post('/api/auth/social', socialLogin);
        
        // Registration OTP Code Generation endpoint with Twilio SMS integration
        app.post('/api/otp/send', async (req, res) => {
            try {
                const { phone } = req.body;
                if (!phone) {
                    return res.status(400).json({ error: 'Thiếu số điện thoại' });
                }

                const existingUser = await User.collection().findOne({ phone });
                if (existingUser) {
                    return res.status(400).json({ error: 'Số điện thoại này đã được đăng ký tài khoản.' });
                }

                const otp = Math.floor(100000 + Math.random() * 900000).toString();
                const expiresAt = new Date(Date.now() + 10 * 60 * 1000); 

                await Otp.saveOtp(phone, otp, expiresAt);
                console.log(`[OTP Register] Mã OTP đăng ký cho SĐT ${phone}: ${otp}`);

                const twilioSid = process.env.TWILIO_ACCOUNT_SID;
                const twilioToken = process.env.TWILIO_AUTH_TOKEN;
                const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

                if (twilioSid && twilioToken) {
                    const twilioClient = require('twilio')(twilioSid, twilioToken);
                    const standardPhone = '+84' + phone.substring(1);
                    await twilioClient.messages.create({
                        body: `Mã xác nhận LightBooks của bạn là: ${otp}. Vui lòng không chia sẻ mã này cho bất kỳ ai.`,
                        from: twilioPhone,
                        to: standardPhone
                    });
                    return res.json({ message: 'Gửi OTP SMS thành công' });
                } else {
                    res.json({ message: 'Gửi OTP thành công', otp });
                }
            } catch (err) {
                console.error('Lỗi khi gửi OTP đăng ký:', err);
                res.status(500).json({ error: 'Lỗi server khi gửi tin nhắn SMS' });
            }
        });

        // API /api/me to resolve user session profile
        app.get('/api/me', async (req, res) => {
            let token = null;
            const authHeader = req.headers['authorization'];
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.split(' ')[1];
            }
            if (!token && req.headers.cookie) {
                const value = `; ${req.headers.cookie}`;
                const parts = value.split(`; accessToken=`);
                if (parts.length === 2) token = parts.pop().split(';').shift();
            }

            if (!token) {
                return res.status(401).json({ error: 'Chưa đăng nhập' });
            }

            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                const user = await User.findUserById(decoded.userId);
                if (!user) {
                    return res.status(404).json({ error: 'Không tìm thấy người dùng' });
                }
                res.json({
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    phone: user.phone || '',
                    avatar: user.avatar || '',
                    address: user.address || '',
                    role: user.role || 'customer'
                });
            } catch (err) {
                res.status(401).json({ error: 'Mã xác thực hết hạn' });
            }
        });

        // API logout to clear cookies
        app.post('/api/logout', (req, res) => {
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');
            res.json({ success: true, message: 'Đăng xuất thành công.' });
        });

        // API lấy danh sách sách từ collection 'books'
        app.get('/api/books', async (req, res) => {
            try {
                const books = await db.collection('books').find({}).toArray();
                res.json(books);
            } catch (err) {
                console.error('Lỗi khi lấy danh sách sách:', err);
                res.status(500).json({ error: 'Lỗi server' });
            }
        });

        // API lấy chi tiết 1 sách theo ID
        app.get('/api/books/:id', async (req, res) => {
            try {
                const bookId = req.params.id;
                const book = await db.collection('books').findOne({ _id: new ObjectId(bookId) });
                if (!book) {
                    return res.status(404).json({ error: 'Không tìm thấy sách' });
                }
                res.json(book);
            } catch (err) {
                console.error('Lỗi khi lấy chi tiết sách:', err);
                res.status(500).json({ error: 'Lỗi server hoặc ID không hợp lệ' });
            }
        });

        app.listen(port, () => {
            console.log(`My server listening on port ${port}`);
        });

    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

startServer();