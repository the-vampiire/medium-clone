require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const controllers = require('./controllers');
const { getDatabaseURI, appMiddleware } = require('./utils');

const app = express();
const { PORT, DOMAIN, NODE_ENV } = process.env;

// -- SERVERWIDE MIDDLEWARE -- //
app.use(...appMiddleware);

// -- ENDPOINTS -- //
app.use('/users', controllers.UsersController);
app.use('/tokens', controllers.TokensController);
app.use('/stories', controllers.StoriesController);

// -- DATABASE INIT -- //
mongoose.set('useCreateIndex', true);
mongoose.set('useNewUrlParser', true);

mongoose.connect(
  getDatabaseURI(NODE_ENV),
  (err) => console.log(err || 'connected to mongo'),
);

// -- SERVER INIT -- //
app.listen(
  PORT,
  (err) => console.log(err || `listening on ${DOMAIN}`),
);

module.exports = app;