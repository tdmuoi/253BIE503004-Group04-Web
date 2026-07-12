const express = require('express');
const router = express.Router();
const PersonalBook = require('../models/PersonalBook');
const { verifyToken: authMiddleware } = require('../middleware/authMiddleware');

// POST /api/personal-books
router.post('/', authMiddleware, async (req, res) => {
    try {
        const userId = (req.user._id || req.user.id).toString();
        const { title, author, favorite, read, ebook, bookId } = req.body;
        
        let imageUrl = req.body.image || req.body.imageUrl || '';
 
        if (!title || !author) {
            return res.status(400).json({ error: 'Title and author are required' });
        }

        const existing = await PersonalBook.collection().findOne({ userId, title });
        if (existing) {
            const newFav = favorite !== undefined ? (favorite === 'true' || favorite === true) : !existing.favorite;
            await PersonalBook.collection().updateOne(
                { _id: existing._id },
                { $set: { favorite: newFav } }
            );
            const updated = await PersonalBook.collection().findOne({ _id: existing._id });
            return res.status(200).json(updated);
        }

        let resolvedBookId = bookId || null;
        if (!resolvedBookId) {
            const db = req.app.locals.db;
            if (db) {
                const matchedBook = await db.collection('books').findOne({ 
                    title: { $regex: new RegExp('^' + title.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') } 
                });
                if (matchedBook) {
                    resolvedBookId = matchedBook._id.toString();
                }
            }
        }
 
        const newBook = await PersonalBook.createPersonalBook({
            userId,
            title,
            author,
            image: imageUrl,
            favorite: favorite === 'true' || favorite === true,
            read: read === 'true' || read === true,
            ebook: ebook === 'true' || ebook === true,
            bookId: resolvedBookId
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
        const userId = (req.user._id || req.user.id).toString();
        const books = await PersonalBook.getPersonalBooksByUser(userId);
        res.json(books);
    } catch (err) {
        console.error('Error fetching personal books:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
