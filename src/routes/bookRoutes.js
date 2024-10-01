const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Book = require('../models/bookModel');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Validation middleware
const validateBook = [
  body('title').notEmpty().withMessage('Title is required'),
  body('author').notEmpty().withMessage('Author is required'),
  body('publishedYear').isInt({ min: 1, max: new Date().getFullYear() })
    .withMessage('Published year must be a valid year'),
];

// Create a new book
router.post('/', auth, validateBook, async (req, res, next) => {
  logger.info('Attempt to create a new book', { user: req.user._id, bookTitle: req.body.title });
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Book creation failed: validation errors', { errors: errors.array(), statusCode: 400 });
      return res.status(400).json({ errors: errors.array() });
    }

    const book = new Book({
      ...req.body,
      addedBy: req.user._id
    });
    const savedBook = await book.save();
    logger.info('Book created successfully', { bookId: book._id, user: req.user._id, statusCode: 201 });
    res.status(201).json(savedBook);
  } catch (error) {
    logger.error('Error creating book', { error: error.message, stack: error.stack, user: req.user._id, statusCode: 500 });
    next(error);
  }
});

// Get all books
router.get('/', async (req, res, next) => {
  logger.info('Fetching all books');
  try {
    const books = await Book.find().populate('addedBy', 'username');
    logger.info('Books fetched successfully', { count: books.length, statusCode: 200 });
    res.json(books);
  } catch (error) {
    logger.error('Error fetching books', { error: error.message, stack: error.stack, statusCode: 500 });
    next(error);
  }
});

// Get a specific book
router.get('/:id', async (req, res, next) => {
  logger.info('Fetching a specific book', { bookId: req.params.id });
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      logger.warn('Invalid book ID provided', { bookId: req.params.id, statusCode: 400 });
      return res.status(400).json({ message: 'Invalid book ID' });
    }

    const book = await Book.findById(req.params.id).populate('addedBy', 'username');
    if (book) {
      logger.info('Book fetched successfully', { bookId: req.params.id, statusCode: 200 });
      res.json(book);
    } else {
      logger.warn('Book not found', { bookId: req.params.id, statusCode: 404 });
      res.status(404).json({ message: 'Book not found' });
    }
  } catch (error) {
    logger.error('Error fetching book', { error: error.message, stack: error.stack, bookId: req.params.id, statusCode: 500 });
    next(error);
  }
});

// Update a book (PUT)
router.put('/:id', auth, validateBook, async (req, res, next) => {
  logger.info('Attempt to update a book', { bookId: req.params.id, user: req.user._id });
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Book update failed: validation errors', { errors: errors.array(), statusCode: 400 });
      return res.status(400).json({ errors: errors.array() });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      logger.warn('Invalid book ID provided', { bookId: req.params.id, statusCode: 400 });
      return res.status(400).json({ message: 'Invalid book ID' });
    }

    const book = await Book.findById(req.params.id);
    if (!book) {
      logger.warn('Book not found for update', { bookId: req.params.id, statusCode: 404 });
      return res.status(404).json({ message: 'Book not found' });
    }
    if (!book.addedBy.equals(req.user._id)) {
      logger.warn('Unauthorized attempt to update book', { bookId: req.params.id, user: req.user._id, statusCode: 403 });
      return res.status(403).json({ message: 'You can only update books you added' });
    }
    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id, 
      { ...req.body, addedBy: req.user._id },
      { new: true, runValidators: true }
    ).populate('addedBy', 'username');
    logger.info('Book updated successfully', { bookId: req.params.id, user: req.user._id, statusCode: 200 });
    res.json(updatedBook);
  } catch (error) {
    logger.error('Error updating book', { error: error.message, stack: error.stack, bookId: req.params.id, user: req.user._id, statusCode: 500 });
    next(error);
  }
});

// Partially update a book (PATCH)
router.patch('/:id', auth, [
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('author').optional().notEmpty().withMessage('Author cannot be empty'),
  body('publishedYear').optional().isInt({ min: 1, max: new Date().getFullYear() })
    .withMessage('Published year must be a valid year'),
], async (req, res, next) => {
  logger.info('Attempt to partially update a book', { bookId: req.params.id, user: req.user._id });
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Book partial update failed: validation errors', { errors: errors.array(), statusCode: 400 });
      return res.status(400).json({ errors: errors.array() });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      logger.warn('Invalid book ID provided', { bookId: req.params.id, statusCode: 400 });
      return res.status(400).json({ message: 'Invalid book ID' });
    }

    const book = await Book.findById(req.params.id);
    if (!book) {
      logger.warn('Book not found for partial update', { bookId: req.params.id, statusCode: 404 });
      return res.status(404).json({ message: 'Book not found' });
    }
    if (!book.addedBy.equals(req.user._id)) {
      logger.warn('Unauthorized attempt to partially update book', { bookId: req.params.id, user: req.user._id, statusCode: 403 });
      return res.status(403).json({ message: 'You can only update books you added' });
    }
    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id, 
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('addedBy', 'username');
    logger.info('Book partially updated successfully', { bookId: req.params.id, user: req.user._id, statusCode: 200 });
    res.json(updatedBook);
  } catch (error) {
    logger.error('Error partially updating book', { error: error.message, stack: error.stack, bookId: req.params.id, user: req.user._id, statusCode: 500 });
    next(error);
  }
});

// Delete a book
router.delete('/:id', auth, async (req, res, next) => {
  logger.info('Attempt to delete a book', { bookId: req.params.id, user: req.user._id });
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      logger.warn('Invalid book ID provided for deletion', { bookId: req.params.id, statusCode: 400 });
      return res.status(400).json({ message: 'Invalid book ID' });
    }

    const book = await Book.findById(req.params.id);
    if (!book) {
      logger.warn('Book not found for deletion', { bookId: req.params.id, statusCode: 404 });
      return res.status(404).json({ message: 'Book not found' });
    }
    if (!book.addedBy.equals(req.user._id)) {
      logger.warn('Unauthorized attempt to delete book', { bookId: req.params.id, user: req.user._id, statusCode: 403 });
      return res.status(403).json({ message: 'You can only delete books you added' });
    }
    await Book.findByIdAndDelete(req.params.id);
    logger.info('Book deleted successfully', { bookId: req.params.id, user: req.user._id, statusCode: 200 });
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    logger.error('Error deleting book', { error: error.message, stack: error.stack, bookId: req.params.id, user: req.user._id, statusCode: 500 });
    next(error);
  }
});

module.exports = router;