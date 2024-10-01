const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const Book = require('../../src/models/bookModel');
const auth = require('../../src/middleware/auth');
const bookRoutes = require('../../src/routes/bookRoutes');

// Create a mock ObjectId outside the mock function
const mockUserId = new mongoose.Types.ObjectId();

// Mock dependencies
jest.mock('../../src/models/bookModel');
jest.mock('../../src/middleware/auth', () => {
  return jest.fn((req, res, next) => {
    req.user = { _id: mockUserId, username: 'testuser' };
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
      const mockBookId = new mongoose.Types.ObjectId();
      const mockBook = {
        title: 'Test Book',
        author: 'Test Author',
        publishedYear: 2021,
        addedBy: mockUserId
      };
      const now = new Date();
      Book.prototype.save.mockResolvedValue({ 
        ...mockBook, 
        _id: mockBookId,
        createdAt: now,
        updatedAt: now
      });

      const res = await request(app)
        .post('/books')
        .send(mockBook);

      expect(res.statusCode).toBe(201);
      expect(res.body).toMatchObject({
        ...mockBook,
        _id: mockBookId.toString(),
        addedBy: mockUserId.toString(),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      });
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
      const now = new Date();
      const mockBooks = [
        { _id: new mongoose.Types.ObjectId(), title: 'Book 1', author: 'Author 1', publishedYear: 2021, addedBy: mockUserId, createdAt: now, updatedAt: now },
        { _id: new mongoose.Types.ObjectId(), title: 'Book 2', author: 'Author 2', publishedYear: 2022, addedBy: mockUserId, createdAt: now, updatedAt: now }
      ];
      Book.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockBooks)
      });

      const res = await request(app).get('/books');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(2);
      res.body.forEach((book, index) => {
        expect(book).toMatchObject({
          ...mockBooks[index],
          _id: mockBooks[index]._id.toString(),
          addedBy: mockUserId.toString(),
          createdAt: now.toISOString(),
          updatedAt: now.toISOString()
        });
      });
    });
  });

  describe('GET /books/:id', () => {
    it('should return a specific book', async () => {
      const now = new Date();
      const mockBookId = new mongoose.Types.ObjectId();
      const mockBook = { 
        _id: mockBookId,
        title: 'Book 1', 
        author: 'Author 1', 
        publishedYear: 2021,
        addedBy: mockUserId,
        createdAt: now,
        updatedAt: now
      };
      Book.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockBook)
      });

      const res = await request(app).get(`/books/${mockBookId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({
        ...mockBook,
        _id: mockBookId.toString(),
        addedBy: mockUserId.toString(),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      });
    });

    it('should return 404 if book not found', async () => {
      Book.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      const res = await request(app).get(`/books/${new mongoose.Types.ObjectId()}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Book not found');
    });
  });

  describe('PUT /books/:id', () => {
    it('should update a book successfully', async () => {
      const now = new Date();
      const mockBookId = new mongoose.Types.ObjectId();
      const mockBook = { 
        _id: mockBookId,
        title: 'Updated Book', 
        author: 'Updated Author', 
        publishedYear: 2022,
        addedBy: mockUserId,
        createdAt: new Date(now.getTime() - 1000),
        updatedAt: now
      };
      Book.findById.mockResolvedValue(mockBook);
      Book.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockBook)
      });

      const res = await request(app)
        .put(`/books/${mockBookId}`)
        .send(mockBook);

      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({
        ...mockBook,
        _id: mockBookId.toString(),
        addedBy: mockUserId.toString(),
        createdAt: mockBook.createdAt.toISOString(),
        updatedAt: mockBook.updatedAt.toISOString()
      });
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
        _id: new mongoose.Types.ObjectId(),
        title: 'Book', 
        author: 'Author', 
        publishedYear: 2021,
        addedBy: new mongoose.Types.ObjectId() // Different from mockUserId
      };
      Book.findById.mockResolvedValue(mockBook);

      const res = await request(app)
        .put(`/books/${mockBook._id}`)
        .send({ title: 'Updated Book', author: 'Updated Author', publishedYear: 2022 });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toBe('You can only update books you added');
    });
  });

  describe('PATCH /books/:id', () => {
    it('should partially update a book successfully', async () => {
      const now = new Date();
      const mockBookId = new mongoose.Types.ObjectId();
      const mockBook = { 
        _id: mockBookId,
        title: 'Original Book', 
        author: 'Original Author', 
        publishedYear: 2021,
        addedBy: mockUserId,
        createdAt: new Date(now.getTime() - 1000),
        updatedAt: now
      };
      const updatedMockBook = { 
        ...mockBook,
        title: 'Updated Book',
        updatedAt: new Date(now.getTime() + 1000)
      };
      Book.findById.mockResolvedValue(mockBook);
      Book.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(updatedMockBook)
      });

      const res = await request(app)
        .patch(`/books/${mockBookId}`)
        .send({ title: 'Updated Book' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toMatchObject({
        ...updatedMockBook,
        _id: mockBookId.toString(),
        addedBy: mockUserId.toString(),
        createdAt: updatedMockBook.createdAt.toISOString(),
        updatedAt: updatedMockBook.updatedAt.toISOString()
      });
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
        _id: new mongoose.Types.ObjectId(),
        title: 'Book', 
        author: 'Author', 
        publishedYear: 2021,
        addedBy: new mongoose.Types.ObjectId() // Different from mockUserId
      };
      Book.findById.mockResolvedValue(mockBook);

      const res = await request(app)
        .patch(`/books/${mockBook._id}`)
        .send({ title: 'Updated Book' });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toBe('You can only update books you added');
    });

    it('should return 400 if PATCH validation fails', async () => {
      const mockBookId = new mongoose.Types.ObjectId();
      const mockBook = { 
        _id: mockBookId,
        title: 'Book', 
        author: 'Author', 
        publishedYear: 2021,
        addedBy: mockUserId
      };
      Book.findById.mockResolvedValue(mockBook);

      const res = await request(app)
        .patch(`/books/${mockBookId}`)
        .send({ publishedYear: 'invalid' });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toBeDefined();
    });
  });

  describe('DELETE /books/:id', () => {
    it('should delete a book successfully', async () => {
      const now = new Date();
      const mockBookId = new mongoose.Types.ObjectId();
      const mockBook = { 
        _id: mockBookId,
        title: 'Book to Delete', 
        author: 'Author', 
        publishedYear: 2021,
        addedBy: mockUserId,
        createdAt: now,
        updatedAt: now
      };
      Book.findById.mockResolvedValue(mockBook);
      Book.findByIdAndDelete.mockResolvedValue(mockBook);

      const res = await request(app).delete(`/books/${mockBookId}`);

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
        _id: new mongoose.Types.ObjectId(),
        title: 'Book', 
        author: 'Author', 
        publishedYear: 2021,
        addedBy: new mongoose.Types.ObjectId() // Different from mockUserId
      };
      Book.findById.mockResolvedValue(mockBook);

      const res = await request(app).delete(`/books/${mockBook._id}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toBe('You can only delete books you added');
    });
  });
});