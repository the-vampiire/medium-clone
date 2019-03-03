const express = require('express');

const {
  verifyPayload,
  decryptAuthedUserID,
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

TokensController.post('/access_token', validateRefreshToken, decryptAuthedUserID, createAccessTokenHandler);

module.exports = TokensController;
