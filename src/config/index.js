require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  mongoURI: process.env.MONGODB_URI || 'mongodb://localhost/bookstore',
  jwtSecret: process.env.JWT_SECRET || 'placeholder_token_incase_of_failure',
};