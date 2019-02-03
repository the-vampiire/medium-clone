const express = require('express');
const { createTokenHandler } = require('./token-utils');
const { verifyPayload, authenticateRequest } = require('./token-middleware');

const TokenController = express.Router();
TokenController.post('/', verifyPayload, authenticateRequest, createTokenHandler);

module.exports = TokenController;
