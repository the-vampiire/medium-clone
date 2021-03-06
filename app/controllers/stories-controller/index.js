const express = require('express');

const { requireAuthedUser } = require('../auth-utils');
const { exchangeSlugForStory, StoryController } = require('./story-controller');
const { latestStoriesHandler, newStoryHandler } = require('./stories-route-handlers');

const StoriesController = express.Router();

StoriesController.get('/', latestStoriesHandler);
StoriesController.post('/', requireAuthedUser, newStoryHandler);

// /stories/:storySlug/ Controller
StoriesController.use('/:storySlug', exchangeSlugForStory, StoryController);

// FUTURE: CategoriesController /stories/:category

module.exports = StoriesController;