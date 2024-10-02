const express = require('express');
const config = require('./config');
const mongoose = require('mongoose')
const v2Router = require('./routes/index');
const errorHandler = require('./middleware/errorHandler');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');


const app = express();
app.use(express.json());

// Mongo connection
mongoose.connect(config.mongoURI, {});

// Routes
app.use('/api/v2', v2Router)

const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Library API',
            version: '1.0.0',
            description: 'Library API documentation',
        },
        servers: [
            {
                url: `http://localhost:${config.port}/api/v2`,
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                }
            }
        }
    },
    apis: [path.join(__dirname, './routes/*.js')],
};


const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Error handler
app.use(errorHandler);

module.exports = app;