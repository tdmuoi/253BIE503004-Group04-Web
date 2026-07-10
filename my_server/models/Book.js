const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    url: { type: String, required: true },
    image: { type: String, required: true },
    title: { type: String, required: true },
    author: { type: String, required: true },
    price_current: { type: Number, required: true },
    price_old: { type: Number, required: true },
    discount_percent: { type: Number, required: true }
});

module.exports = mongoose.model('Book', bookSchema);
