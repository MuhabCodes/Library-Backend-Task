// src/app.js
const express = require('express');
const config = require('./config');

const app = express();

app.use(express.json());

module.exports = app;