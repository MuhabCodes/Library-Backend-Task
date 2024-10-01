const express = require('express');
const config = require('./config');
const mongoose = require('mongoose')
const bookRoutes = require('./routes/bookRoutes');
const authRoutes = require('./routes/authRoutes');


const app = express();
app.use(express.json());



// Mongo connection
mongoose.connect(config.mongoURI, {});

// Routes
app.use('/api/books', bookRoutes);
app.use('/api/auth', authRoutes);

module.exports = app;