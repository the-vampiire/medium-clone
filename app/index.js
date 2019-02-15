require('dotenv').config();

const app = require('./app');
const mongoose = require('mongoose');
const { getDatabaseURI } = require('../db/utils');

const { PORT, DOMAIN, NODE_ENV } = process.env;

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