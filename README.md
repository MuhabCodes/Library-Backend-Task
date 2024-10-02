# Book Management API

## Overview

This project is a RESTful API for managing a book collection. It's built with Node.js, Express, and MongoDB, featuring JWT authentication for secure access to protected routes.

Key features:
- User registration and authentication
- CRUD operations for books
- Data validation
- Error handling and logging
- Unit testing with Jest

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or later)
- MongoDB

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/book-management-api.git
   cd book-management-api
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following content:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/bookstore
   JWT_SECRET=your_jwt_secret_here
   ```
   Replace `your_jwt_secret_here` with a secure secret key.

## Running the Application

1. Start MongoDB:
   ```
   mongod
   ```

2. Run the application:
   ```
   npm start
   ```

The server will start running on `http://localhost:3000` (or the port specified in your .env file).

## Running Tests

To run the unit tests:

```
npm test
```

## API Documentation

### Authentication Endpoints

#### Register a new user
- **POST** `/api/auth/register`
- Body: `{ "username": "user", "password": "password" }`

#### Login
- **POST** `/api/auth/login`
- Body: `{ "username": "user", "password": "password" }`
- Returns: JWT token

### Book Endpoints

All book endpoints (except GET) require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer your_jwt_token
```

#### Create a new book
- **POST** `/api/books`
- Body: `{ "title": "Book Title", "author": "Author Name", "publishedYear": 2023 }`

#### Get all books
- **GET** `/api/books`

#### Get a specific book
- **GET** `/api/books/:id`

#### Update a book
- **PUT** `/api/books/:id`
- Body: `{ "title": "Updated Title", "author": "Updated Author", "publishedYear": 2023 }`

#### Partially update a book
- **PATCH** `/api/books/:id`
- Body: `{ "title": "Updated Title" }`

#### Delete a book
- **DELETE** `/api/books/:id`

## Error Handling

The API uses standard HTTP status codes to indicate the success or failure of requests. Detailed error messages are provided in the response body.

## Logging

Logs are written to `error.log` and `combined.log` files in the project root directory.