const express = require('express');

const { requireClapOwnership } = require('./reader-clap-middleware');
const { requireAuthedUser } = require('../../../../auth-utils');
const {
  readerClapDiscoveryHandler,
  updateReaderClapHandler,
} = require('./reader-clap-route-handlers');

// /stories/:storySlug/claps/:usernameSlug Controller
const ReaderClapController = express.Router();

ReaderClapController.get('/', readerClapDiscoveryHandler);
ReaderClapController.patch('/', requireAuthedUser, requireClapOwnership, updateReaderClapHandler);

module.exports = {
  ReaderClapController,
};