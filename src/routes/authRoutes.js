const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/userModel');
const config = require('../config');
const logger = require('../utils/logger');

// User registration
router.post('/register', [
  body('username').isLength({ min: 6 }).withMessage('Username must be at least 6 characters long'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
], async (req, res, next) => {
  logger.info('Registration attempt', { username: req.body.username });
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Registration failed: validation errors', { errors: errors.array(), statusCode: 400 });
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username: req.body.username }).lean();
    if (existingUser) {
      logger.warn('Registration failed: username already exists', { username: req.body.username, statusCode: 400 });
      return res.status(400).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = new User({
      username: req.body.username,
      password: hashedPassword,
    });
    await user.save();
    logger.info('User registered successfully', { username: req.body.username, statusCode: 201 });
    res.status(201).send('User registered successfully');
  } catch (error) {
    if (error.code === 11000) {
      // MongoDB duplicate key error
      logger.warn('Registration failed: username already exists (duplicate key)', { username: req.body.username, statusCode: 400 });
      return res.status(400).json({ message: 'Username already exists' });
    }
    logger.error('Registration error', { error: error.message, stack: error.stack, statusCode: 500 });
    next(error);
  }
});

// User login
router.post('/login', [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res, next) => {
  logger.info('Login attempt', { username: req.body.username });
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Login failed: validation errors', { errors: errors.array(), statusCode: 400 });
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findOne({ username: req.body.username }).lean();
    if (user && await bcrypt.compare(req.body.password, user.password)) {
      const token = jwt.sign({ username: user.username }, config.jwtSecret, { expiresIn: '1h' });
      logger.info('User logged in successfully', { username: req.body.username, statusCode: 200 });
      res.json({ token });
    } else {
      logger.warn('Login failed: invalid credentials', { username: req.body.username, statusCode: 400 });
      res.status(400).send('Invalid credentials');
    }
  } catch (error) {
    logger.error('Login error', { error: error.message, stack: error.stack, statusCode: 500 });
    next(error);
  }
});

module.exports = router;