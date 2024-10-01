const express = require('express');
const router = express.Router();
const Book = require('../models/bookModel');
const auth = require('../middleware/auth');

// Create a new book
router.post('/', auth, async (req, res, next) => {
  try {
    const book = new Book({
      ...req.body,
      addedBy: req.user.username,
      addedAt: new Date()
    });
    await book.save();
    res.status(201).json(book);
  } catch (error) {
    if (error.name === 'ValidationError') {
      error.status = 400;
      error.message = 'Invalid book data';
    } else {
      error.status = 500;
      error.message = 'Error creating book';
    }
    next(error);
  }
});

// Get all books
router.get('/', async (req, res, next) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (error) {
    next(error);
  }
});

// Get a specific book
router.get('/:id', async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (book) {
      res.json(book);
    } else {
      res.status(404).json({ message: 'Book not found' });
    }
  } catch (error) {
    next(error);
  }
});

// Update a book (PUT)
router.put('/:id', auth, async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    if (book.addedBy !== req.user.username) {
      return res.status(403).json({ message: 'You can only update books you added' });
    }
    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id, 
      { ...req.body, addedBy: req.user.username },
      { new: true }
    );
    res.json(updatedBook);
  } catch (error) {
    next(error);
  }
});

// Partially update a book (PATCH)
router.patch('/:id', auth, async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    if (book.addedBy !== req.user.username) {
      return res.status(403).json({ message: 'You can only update books you added' });
    }
    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id, 
      { $set: { ...req.body, addedBy: req.user.username } },
      { new: true }
    );
    res.json(updatedBook);
  } catch (error) {
    next(error);
  }
});

// Delete a book
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    if (book.addedBy !== req.user.username) {
      return res.status(403).json({ message: 'You can only delete books you added' });
    }
    await Book.findByIdAndDelete(req.params.id);
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;