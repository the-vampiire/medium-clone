const express = require('express');

const { requireAuthedUser } = require('../auth-utils');
const {
  getMeHandler,
} = require('./me-route-handlers');

const MeController = express.Router();

MeController.get('/', requireAuthedUser, getMeHandler);

module.exports = MeController;
