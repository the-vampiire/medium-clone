const express = require('express');
const { requireAuthedUser } = require('../require-authed-user');
const { latestStoriesHandler, newStoryHandler } = require('./stories-route-handlers');
const {
  exchangeSlugForStory,
  StoryController,
} = require('./story-controller');

const StoriesController = express.Router();

StoriesController.get('/', latestStoriesHandler);
StoriesController.post('/', requireAuthedUser, newStoryHandler);

// /stories/:storySlug/ Controller
StoriesController.use('/:storySlug', exchangeSlugForStory, StoryController);

// FUTURE: CategoriesController /stories/:category

module.exports = StoriesController;