const express = require('express');

const {
  verifyPayload,
  authenticateRequest,
  validateRefreshToken,
} = require('./tokens-middleware');
const {
  createAccessTokenHandler,
  createRefreshTokenHandler,
  revokeRefreshTokenHandler,
} = require('./tokens-route-handlers');

// controls: /tokens/
const TokensController = express.Router();

TokensController.post('/', verifyPayload, authenticateRequest, createRefreshTokenHandler);

TokensController.delete('/', validateRefreshToken, revokeRefreshTokenHandler);

TokensController.get('/access_token', validateRefreshToken, createAccessTokenHandler);

module.exports = TokensController;
