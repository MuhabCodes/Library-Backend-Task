const express = require('express');
const config = require('./config');
const mongoose = require('mongoose')
const bookRoutes = require('./routes/bookRoutes');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middleware/errorHandler');


const app = express();
app.use(express.json());

// Error handler
app.use(errorHandler);

// Mongo connection
mongoose.connect(config.mongoURI, {});

// Routes
app.use('/api/books', bookRoutes);
app.use('/api/auth', authRoutes);

module.exports = app;