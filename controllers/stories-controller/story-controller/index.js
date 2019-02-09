const express = require('express');

const { requireAuthedUser } = require('../../require-authed-user'); 
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

// story replies
StoryController.get('/replies', storyRepliesHandler);
StoryController.post('/replies', requireAuthedUser, createStoryReplyHandler);

  // ClapsController: /stories/:storySlug/claps
  // GET: { clappedReaders: [], totalClaps: Number }
  // POST: clap for story
  // GET /claps/@username: gets the user claps on a clapped story
  // PUT /claps/@username: update user claps on clapped story
  // DELETE /claps/@username: remove user claps on story

module.exports = {
  exchangeSlugForStory,
  StoryController,
};