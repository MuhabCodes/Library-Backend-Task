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

/**
 * @openapi
 * tags:
 *   name: Books
 *   description: Book management endpoints
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     Book:
 *       type: object
 *       required:
 *         - title
 *         - author
 *         - publishedYear
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the book
 *         title:
 *           type: string
 *           description: The title of the book
 *         author:
 *           type: string
 *           description: The author of the book
 *         publishedYear:
 *           type: integer
 *           description: The year the book was published
 *         addedBy:
 *           $ref: '#/components/schemas/User'
 *           description: The user who added the book
 */


// Create a new book
/**
 * @openapi
 * /books:
 *   post:
 *     summary: Create a new book
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Book'
 *     responses:
 *       201:
 *         description: The book was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 *   get:
 *     summary: Get all books
 *     tags: [Books]
 *     responses:
 *       200:
 *         description: The list of books
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Book'
 *       500:
 *         description: Server error
 */
router.post('/', auth, validateBook, async (req, res, next) => {
  logger.info('Attempt to create a new book', { user: req.user._id, bookTitle: req.body.title });
  try {
    // Validate Input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Book creation failed: validation errors', { errors: errors.array(), statusCode: 400 });
      return res.status(400).json({ errors: errors.array() });
    }

    // Create & save the new book
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
/**
 * @openapi
 * /books:
 *   get:
 *     summary: Get all books
 *     tags: [Books]
 *     responses:
 *       200:
 *         description: The list of books
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Book'
 *       500:
 *         description: Server error
 */
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
/**
 * @openapi
 * /books/{id}:
 *   get:
 *     summary: Get a specific book
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The book ID
 *     responses:
 *       200:
 *         description: The book details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *       400:
 *         description: Invalid book ID
 *       404:
 *         description: Book not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res, next) => {
  logger.info('Fetching a specific book', { bookId: req.params.id });
  try {
    // Validate book ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      logger.warn('Invalid book ID provided', { bookId: req.params.id, statusCode: 400 });
      return res.status(400).json({ message: 'Invalid book ID' });
    }

    // Find and return book
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
/**
 * @openapi
 * /books/{id}:
 *   put:
 *     summary: Update a book
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The book ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Book'
 *     responses:
 *       200:
 *         description: The updated book
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *       400:
 *         description: Validation error or invalid book ID
 *       403:
 *         description: Unauthorized - can only update books you added
 *       404:
 *         description: Book not found
 *       500:
 *         description: Server error
 */
router.put('/:id', auth, validateBook, async (req, res, next) => {
  logger.info('Attempt to update a book', { bookId: req.params.id, user: req.user._id });
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Book update failed: validation errors', { errors: errors.array(), statusCode: 400 });
      return res.status(400).json({ errors: errors.array() });
    }

    // Validate book ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      logger.warn('Invalid book ID provided', { bookId: req.params.id, statusCode: 400 });
      return res.status(400).json({ message: 'Invalid book ID' });
    }

    // Check if book exists
    const book = await Book.findById(req.params.id);
    if (!book) {
      logger.warn('Book not found for update', { bookId: req.params.id, statusCode: 404 });
      return res.status(404).json({ message: 'Book not found' });
    }
    // Check if the user has permission to update the matching book
    if (!book.addedBy.equals(req.user._id)) {
      logger.warn('Unauthorized attempt to update book', { bookId: req.params.id, user: req.user._id, statusCode: 403 });
      return res.status(403).json({ message: 'You can only update books you added' });
    }

    // Update book
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
/**
 * @openapi
 * /books/{id}:
 *   patch:
 *     summary: Partially update a book
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The book ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               author:
 *                 type: string
 *               publishedYear:
 *                 type: integer
 *     responses:
 *       200:
 *         description: The updated book
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *       400:
 *         description: Validation error or invalid book ID
 *       403:
 *         description: Unauthorized - can only update books you added
 *       404:
 *         description: Book not found
 *       500:
 *         description: Server error
 */
router.patch('/:id', auth, [
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('author').optional().notEmpty().withMessage('Author cannot be empty'),
  body('publishedYear').optional().isInt({ min: 1, max: new Date().getFullYear() })
    .withMessage('Published year must be a valid year'),
], async (req, res, next) => {
  logger.info('Attempt to partially update a book', { bookId: req.params.id, user: req.user._id });
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Book partial update failed: validation errors', { errors: errors.array(), statusCode: 400 });
      return res.status(400).json({ errors: errors.array() });
    }

    // Validate book ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      logger.warn('Invalid book ID provided', { bookId: req.params.id, statusCode: 400 });
      return res.status(400).json({ message: 'Invalid book ID' });
    }

    // Check if book exists
    const book = await Book.findById(req.params.id);
    if (!book) {
      logger.warn('Book not found for partial update', { bookId: req.params.id, statusCode: 404 });
      return res.status(404).json({ message: 'Book not found' });
    }
    // Check if the user has permission to update the matching book
    if (!book.addedBy.equals(req.user._id)) {
      logger.warn('Unauthorized attempt to partially update book', { bookId: req.params.id, user: req.user._id, statusCode: 403 });
      return res.status(403).json({ message: 'You can only update books you added' });
    }

    // Partially update the book
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
/**
 * @openapi
 * /books/{id}:
 *   delete:
 *     summary: Delete a book
 *     tags: [Books]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The book ID
 *     responses:
 *       200:
 *         description: Book deleted successfully
 *       400:
 *         description: Invalid book ID
 *       403:
 *         description: Unauthorized - can only delete books you added
 *       404:
 *         description: Book not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', auth, async (req, res, next) => {
  logger.info('Attempt to delete a book', { bookId: req.params.id, user: req.user._id });
  try {
    // Validate book ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      logger.warn('Invalid book ID provided for deletion', { bookId: req.params.id, statusCode: 400 });
      return res.status(400).json({ message: 'Invalid book ID' });
    }

    // Check if book exists
    const book = await Book.findById(req.params.id);
    if (!book) {
      logger.warn('Book not found for deletion', { bookId: req.params.id, statusCode: 404 });
      return res.status(404).json({ message: 'Book not found' });
    }

    // Check if the user has permission to update the matching book
    if (!book.addedBy.equals(req.user._id)) {
      logger.warn('Unauthorized attempt to delete book', { bookId: req.params.id, user: req.user._id, statusCode: 403 });
      return res.status(403).json({ message: 'You can only delete books you added' });
    }


    // Delete book
    await Book.findByIdAndDelete(req.params.id);
    logger.info('Book deleted successfully', { bookId: req.params.id, user: req.user._id, statusCode: 200 });
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    logger.error('Error deleting book', { error: error.message, stack: error.stack, bookId: req.params.id, user: req.user._id, statusCode: 500 });
    next(error);
  }
});

module.exports = router;