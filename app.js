const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const models = require('./models');

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

mongoose.connect(
  `${process.env.MONGO_URI}${MONGO_DB}`,
  (err) => console.error(err),
);

const PORT = process.env.PORT || 8008;

app.listen(
  PORT,
  (err) => console.log(err || `listening on 127.0.0.1:${PORT}`),
);

