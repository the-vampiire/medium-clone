const express = require('express');
const { requireAuthedUser } = require('../require-authed-user');
const { latestStoriesHandler, newStoryHandler } = require('./stories-route-handlers');
// TODO: implement
// const {
//   exchangeSlugForStory,
//   storyNotFoundRedirect,
//   StoryController,
// } = require('./story-controller');

const StoriesController = express.Router();

StoriesController.get('/', latestStoriesHandler);
StoriesController.post('/', requireAuthedUser, newStoryHandler);

// TODO: implement
// /stories/:storySlug/ Controller
// StoriesController.use(
//   '/:storySlug',
//   exchangeSlugForStory,
//   storyNotFoundRedirect,
//   StoryController,
// );

// StoryController: /stories/:storySlug
// GET: story
// DELETE: authenticated -> delete story
// PUT: authenticated -> update story
// POST: /publish -> publish story

  // ResponsesController: /stories/:storySlug/responses
  // GET: story responses
  // POST: respond to story
  // DELETE: 

  // ClapsController: /stories/:storySlug/claps
  // GET: { clappedUser: [], readerClaps: Number }
  // POST: clap for story
  // PUT: update claps on clapped story
  // DELETE: remove claps on story

// FUTURE: CategoriesController /stories/:category

module.exports = StoriesController;