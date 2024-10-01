// src/app.js
const express = require('express');
const config = require('./config');
const mongoose = require('mongoose')

const app = express();
app.use(express.json());

mongoose.connect(config.mongoURI, {});

module.exports = app;