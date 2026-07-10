const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
    fullName: { type: String, default: '' },
    fullname: { type: String, default: '' }, // For compatibility
    email: { type: String, unique: true, sparse: true },
    avatar: { type: String, default: 'https://api.dicebear.com/7.x/adventurer/svg?seed=lightbook_user' },
    provider: { type: String, default: 'local' }, // 'local' | 'google' | 'facebook'
    providerId: { type: String, default: '' },
    password: { type: String, default: null }, // bcrypt hashed password
    password_hash: { type: String, default: null }, // For compatibility
    phone: { type: String, unique: true, sparse: true }, // Keep for SĐT auth
    address: { type: String, default: '' }, // Keep for delivery info
    role: { type: String, default: 'user' }
}, { 
    collection: 'users', // Explicitly store in 'users' collection as requested
    timestamps: true 
});

module.exports = mongoose.model('Account', accountSchema);
