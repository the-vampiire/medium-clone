require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const models = require('./models');
const { getDatabaseURI } = require('./utils');
const { UserController } = require('./controllers');

const app = express();

app.use(
  bodyParser.json(),
  bodyParser.urlencoded({ extended: false }),
  (req, _, next) => {
    // add db models to all request objects for easy access
    req.models = models;
    next();
  },
);

// -- ENDPOINTS -- //
app.use('/user', UserController);

mongoose.set('useCreateIndex', true);
mongoose.connect(
  getDatabaseURI(),
  (err) => console.log(err || 'connected to mongo'),
);

const PORT = process.env.PORT || 8008;
app.listen(
  PORT,
  (err) => console.log(err || `listening on 127.0.0.1:${PORT}`),
);

