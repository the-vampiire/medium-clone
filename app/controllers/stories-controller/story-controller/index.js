const express = require('express');

const { StoryClapsController } = require('./story-claps-controller');
const { requireAuthedUser } = require('../../auth-utils');
const { exchangeSlugForStory, requireAuthorship } = require('./story-controller-middleware');
const { storyRepliesHandler, createStoryReplyHandler } = require('./story-replies-handlers');
const {
  storyDiscoveryHandler,
  storyUpdateHandler,
  storyDeleteHandler,
} = require('./story-route-handlers');

// Story Controller: /stories/:storySlug/
const StoryController = express.Router();

StoryController.get('/', storyDiscoveryHandler);
StoryController.patch('/', requireAuthedUser, requireAuthorship, storyUpdateHandler);
StoryController.delete('/', requireAuthedUser, requireAuthorship, storyDeleteHandler);

StoryController.get('/replies', storyRepliesHandler);
StoryController.post('/replies', requireAuthedUser, createStoryReplyHandler);

StoryController.use('/claps', StoryClapsController);

module.exports = {
  exchangeSlugForStory,
  StoryController,
};