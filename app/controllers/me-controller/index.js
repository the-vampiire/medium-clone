const express = require('express');

const { requireAuthedUser } = require('../require-authed-user');
const {
  getMeHandler,
} = require('./me-route-handlers');

const MeController = express.Router();

MeController.get('/', requireAuthedUser, getMeHandler);

module.exports =  MeController;
