const express = require('express');
const createTokenHandler = require('./create-token-handler');
const { verifyPayload, authenticateRequest } = require('./token-middleware');

const TokensController = express.Router();

TokensController.post('/', verifyPayload, authenticateRequest, createTokenHandler);

module.exports = TokensController;
