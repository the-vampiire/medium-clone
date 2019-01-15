require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const models = require('./models');
const { getDatabaseURI } = require('./utils');
const { UserController, UserControllerMiddleware } = require('./controllers');

const app = express();


// -- SERVERWIDE MIDDLEWARE -- //
app.use(
  bodyParser.json(),
  bodyParser.urlencoded({ extended: false }),
  (req, _, next) => {
    // add db models to all request objects for easy access and testing
    req.models = models;
    next();
  },
);

// -- ENDPOINTS -- //
app.use('/user/:usernameSlug', ...UserControllerMiddleware, UserController);

// -- DATABASE INIT -- //
mongoose.set('useCreateIndex', true);
mongoose.set('useNewUrlParser', true);

mongoose.connect(
  getDatabaseURI(),
  (err) => console.log(err || 'connected to mongo'),
);

// -- SERVER INIT -- //
const DOMAIN = process.env.DOMAIN;
const PORT = process.env.PORT;

app.listen(
  PORT,
  (err) => console.log(err || `listening on ${DOMAIN}`),
);

