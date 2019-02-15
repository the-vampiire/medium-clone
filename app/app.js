const express = require('express');

const controllers = require('./controllers');
const { appMiddleware } = require('./app-middleware');

const app = express();

// -- SERVERWIDE MIDDLEWARE -- //
app.use(...appMiddleware);

// -- ENDPOINTS -- //
app.use('/users', controllers.UsersController);
app.use('/tokens', controllers.TokensController);
app.use('/stories', controllers.StoriesController);

module.exports = app;