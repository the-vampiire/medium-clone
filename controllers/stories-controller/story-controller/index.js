const express = require('express');

const { requireAuthedUser } = require('../../require-authed-user'); 
const { exchangeSlugForStory, requireAuthorship } = require('./story-controller-middleware');
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


  // ResponsesController: /stories/:storySlug/responses
  // GET: story responses
  // POST: respond to story
  // DELETE: 

  // ClapsController: /stories/:storySlug/claps
  // GET: { clappedUser: [], readerClaps: Number }
  // POST: clap for story
  // PUT: update claps on clapped story
  // DELETE: remove claps on story

module.exports = {
  exchangeSlugForStory,
  StoryController,
};