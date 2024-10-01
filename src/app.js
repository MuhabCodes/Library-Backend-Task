const express = require('express');
const { Router } = require('express');
const config = require('./config');
const mongoose = require('mongoose')
const v2Router = require('./routes/index');
const errorHandler = require('./middleware/errorHandler');


const app = express();
app.use(express.json());

// Error handler
app.use(errorHandler);

// Mongo connection
mongoose.connect(config.mongoURI, {});

// Routes
app.use('/api/v2', v2Router)

module.exports = app;
module.exports = router;