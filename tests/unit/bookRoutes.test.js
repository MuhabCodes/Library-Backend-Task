const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const Book = require('../../src/models/bookModel');
const auth = require('../../src/middleware/auth');
const bookRoutes = require('../../src/routes/bookRoutes');

// Mock dependencies
jest.mock('../../src/models/bookModel');
jest.mock('../../src/middleware/auth', () => {
  return jest.fn((req, res, next) => {
    req.user = { username: 'testuser' };
    next();
  });
});

const app = express();
app.use(express.json());
app.use('/books', bookRoutes);

describe('Book Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /books', () => {
    it('should create a new book successfully', async () => {
      const mockBook = {
        title: 'Test Book',
        author: 'Test Author',
        publishedYear: 2021,
        addedBy: 'testuser'
      };
      Book.prototype.save.mockResolvedValue({ 
        ...mockBook, 
        _id: new mongoose.Types.ObjectId(),
      });

      const res = await request(app)
        .post('/books')
        .send(mockBook);

      expect(res.statusCode).toBe(201);
      expect(res.body).toMatchObject(mockBook);
      expect(res.body._id).toBeDefined();
    });

    it('should return 400 if validation fails', async () => {
      const res = await request(app)
        .post('/books')
        .send({ title: '', author: '', publishedYear: 'invalid' });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('GET /books', () => {
    it('should return all books', async () => {
      const mockBooks = [
        { title: 'Book 1', author: 'Author 1', publishedYear: 2021 },
        { title: 'Book 2', author: 'Author 2', publishedYear: 2022 }
      ];
      Book.find.mockResolvedValue(mockBooks.map(book => ({ ...book, _id: new mongoose.Types.ObjectId() })));

      const res = await request(app).get('/books');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0]._id).toBeDefined();
      expect(res.body[1]._id).toBeDefined();
    });
  });

  describe('GET /books/:id', () => {
    it('should return a specific book', async () => {
      const mockBook = { title: 'Book 1', author: 'Author 1', publishedYear: 2021 };
      const mockId = new mongoose.Types.ObjectId();
      Book.findById.mockResolvedValue({ ...mockBook, _id: mockId });

      const res = await request(app).get(`/books/${mockId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject(mockBook);
      expect(res.body._id).toBeDefined();
    });

    it('should return 404 if book not found', async () => {
      Book.findById.mockResolvedValue(null);

      const res = await request(app).get(`/books/${new mongoose.Types.ObjectId()}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Book not found');
    });
  });

  describe('PUT /books/:id', () => {
    it('should update a book successfully', async () => {
      const mockBook = { 
        title: 'Updated Book', 
        author: 'Updated Author', 
        publishedYear: 2022,
        addedBy: 'testuser'
      };
      const mockId = new mongoose.Types.ObjectId();
      Book.findById.mockResolvedValue({ ...mockBook, _id: mockId });
      Book.findByIdAndUpdate.mockResolvedValue({ ...mockBook, _id: mockId });

      const res = await request(app)
        .put(`/books/${mockId}`)
        .send(mockBook);

      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject(mockBook);
      expect(res.body._id).toBeDefined();
    });

    it('should return 404 if book not found', async () => {
      Book.findById.mockResolvedValue(null);

      const res = await request(app)
        .put(`/books/${new mongoose.Types.ObjectId()}`)
        .send({ title: 'Updated Book', author: 'Updated Author', publishedYear: 2022 });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Book not found');
    });

    it('should return 403 if user is not the book creator', async () => {
      const mockBook = { 
        title: 'Book', 
        author: 'Author', 
        publishedYear: 2021,
        addedBy: 'otheruser'
      };
      Book.findById.mockResolvedValue({ ...mockBook, _id: new mongoose.Types.ObjectId() });

      const res = await request(app)
        .put(`/books/${new mongoose.Types.ObjectId()}`)
        .send({ title: 'Updated Book', author: 'Updated Author', publishedYear: 2022 });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toBe('You can only update books you added');
    });
  });

  describe('PATCH /books/:id', () => {
    it('should partially update a book successfully', async () => {
      const mockBook = { 
        title: 'Original Book', 
        author: 'Original Author', 
        publishedYear: 2021,
        addedBy: 'testuser'
      };
      const updatedMockBook = { 
        ...mockBook,
        title: 'Updated Book'
      };
      const mockId = new mongoose.Types.ObjectId();
      Book.findById.mockResolvedValue({ ...mockBook, _id: mockId });
      Book.findByIdAndUpdate.mockResolvedValue({ ...updatedMockBook, _id: mockId });

      const res = await request(app)
        .patch(`/books/${mockId}`)
        .send({ title: 'Updated Book' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject(updatedMockBook);
      expect(res.body._id).toBeDefined();
    });

    it('should return 404 if book not found for PATCH', async () => {
      Book.findById.mockResolvedValue(null);

      const res = await request(app)
        .patch(`/books/${new mongoose.Types.ObjectId()}`)
        .send({ title: 'Updated Book' });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Book not found');
    });

    it('should return 403 if user is not the book creator for PATCH', async () => {
      const mockBook = { 
        title: 'Book', 
        author: 'Author', 
        publishedYear: 2021,
        addedBy: 'otheruser'
      };
      Book.findById.mockResolvedValue({ ...mockBook, _id: new mongoose.Types.ObjectId() });

      const res = await request(app)
        .patch(`/books/${new mongoose.Types.ObjectId()}`)
        .send({ title: 'Updated Book' });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toBe('You can only update books you added');
    });

    it('should return 400 if PATCH validation fails', async () => {
      const mockBook = { 
        title: 'Book', 
        author: 'Author', 
        publishedYear: 2021,
        addedBy: 'testuser'
      };
      Book.findById.mockResolvedValue({ ...mockBook, _id: new mongoose.Types.ObjectId() });

      const res = await request(app)
        .patch(`/books/${new mongoose.Types.ObjectId()}`)
        .send({ publishedYear: 'invalid' });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('DELETE /books/:id', () => {
    it('should delete a book successfully', async () => {
      const mockBook = { 
        title: 'Book to Delete', 
        author: 'Author', 
        publishedYear: 2021,
        addedBy: 'testuser'
      };
      const mockId = new mongoose.Types.ObjectId();
      Book.findById.mockResolvedValue({ ...mockBook, _id: mockId });
      Book.findByIdAndDelete.mockResolvedValue({ ...mockBook, _id: mockId });

      const res = await request(app).delete(`/books/${mockId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Book deleted successfully');
    });

    it('should return 404 if book not found for deletion', async () => {
      Book.findById.mockResolvedValue(null);

      const res = await request(app).delete(`/books/${new mongoose.Types.ObjectId()}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Book not found');
    });

    it('should return 403 if user is not the book creator for deletion', async () => {
      const mockBook = { 
        title: 'Book', 
        author: 'Author', 
        publishedYear: 2021,
        addedBy: 'otheruser'
      };
      Book.findById.mockResolvedValue({ ...mockBook, _id: new mongoose.Types.ObjectId() });

      const res = await request(app).delete(`/books/${new mongoose.Types.ObjectId()}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toBe('You can only delete books you added');
    });
  });
});