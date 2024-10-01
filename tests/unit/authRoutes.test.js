const request = require('supertest');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../../src/models/userModel');
const config = require('../../src/config');
const authRoutes = require('../../src/routes/authRoutes');

// Mock dependencies
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../../src/models/userModel');
jest.mock('../../src/config', () => ({ jwtSecret: 'test_secret' }));

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

describe('Auth Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      User.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashedPassword');
      User.prototype.save.mockResolvedValue();

      const res = await request(app)
        .post('/auth/register')
        .send({ username: 'testuser', password: 'testpassword' });

      expect(res.statusCode).toBe(201);
      expect(res.text).toBe('User registered successfully');
    });

    it('should return 400 if username already exists', async () => {
      User.findOne.mockResolvedValue({ username: 'testuser' });

      const res = await request(app)
        .post('/auth/register')
        .send({ username: 'testuser', password: 'testpassword' });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Username already exists');
    });

    it('should return 400 if validation fails', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ username: 'test', password: 'short' });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('POST /auth/login', () => {
    it('should login user successfully', async () => {
      User.findOne.mockResolvedValue({
        username: 'testuser',
        password: 'hashedPassword'
      });
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('testtoken');

      const res = await request(app)
        .post('/auth/login')
        .send({ username: 'testuser', password: 'testpassword' });

      expect(res.statusCode).toBe(200);
      expect(res.body.token).toBe('testtoken');
    });

    it('should return 400 if credentials are invalid', async () => {
      User.findOne.mockResolvedValue(null);

      const res = await request(app)
        .post('/auth/login')
        .send({ username: 'testuser', password: 'testpassword' });

      expect(res.statusCode).toBe(400);
      expect(res.text).toBe('Invalid credentials');
    });

    it('should return 400 if validation fails', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ username: '', password: '' });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toBeDefined();
    });
  });
});