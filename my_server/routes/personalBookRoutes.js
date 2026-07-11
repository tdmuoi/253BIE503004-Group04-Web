const express = require('express');
const router = express.Router();
const PersonalBook = require('../models/PersonalBook');
const { verifyToken: authMiddleware } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

// POST /api/personal-books
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        const userId = req.user.id;
        const { title, author, favorite, read, ebook } = req.body;
        
        let imageUrl = '';
        if (req.file) {
            imageUrl = req.file.path; // Cloudinary URL
        }

        if (!title || !author) {
            return res.status(400).json({ error: 'Title and author are required' });
        }

        const newBook = await PersonalBook.createPersonalBook({
            userId,
            title,
            author,
            image: imageUrl,
            favorite: favorite === 'true' || favorite === true,
            read: read === 'true' || read === true,
            ebook: ebook === 'true' || ebook === true
        });

        res.status(201).json(newBook);
    } catch (err) {
        console.error('Error adding personal book:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/personal-books
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const books = await PersonalBook.getPersonalBooksByUser(userId);
        res.json(books);
    } catch (err) {
        console.error('Error fetching personal books:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
