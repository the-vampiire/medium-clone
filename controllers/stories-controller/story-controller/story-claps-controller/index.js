const express = require('express');

// const { ReaderClapController } = require('./reader-clap-controller');
const { requireAuthedUser } = require('../../../require-authed-user');
const { exchangeSlugForUser } = require('../../../users-controller/user-controller');
const { clappedReadersHandler, clapForStoryHandler } = require('./story-claps-route-handlers');

const StoryClapsController = express.Router();

StoryClapsController.get('/', clappedReadersHandler);
StoryClapsController.post('/', requireAuthedUser, clapForStoryHandler);

// /claps/:usernameSlug: manage individual user's clap resource
// StoryClapsController.use('/:usernameSlug', exchangeSlugForUser, ReaderClapController);

module.exports = {
  StoryClapsController,
};
 