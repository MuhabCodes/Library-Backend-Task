require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  mongoURI: process.env.MONGODB_URI || 'mongodb://localhost/bookstore',
  jwtSecret: process.env.JWT_SECRET || 'c632d6333761bcf6974ef8365272e01ac1bf36f819c89a32668b82045d88f8ac51d02255736f0c19b1a6b58d597aefcab025127242f8a1d151b253f58229512f',
};