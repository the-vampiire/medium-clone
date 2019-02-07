const express = require('express');
const UserFollowersController = require('./user-follow-controller');
const { exchangeSlugForUser } = require('./user-controller-middleware');
const {
  userDiscoveryHandler,
  userStoriesHandler,
  userResponsesHandler,
  userFollowingHandler,
  userClappedStoriesHandler,
} = require('./user-route-handlers');

// controls: /users/:usernameSlug/
const UserController = express.Router();

UserController.get('/', userDiscoveryHandler);
UserController.get('/stories', userStoriesHandler);
UserController.get('/responses', userResponsesHandler);
UserController.get('/following', userFollowingHandler);
UserController.use('/followers', UserFollowersController);
UserController.get('/clapped', userClappedStoriesHandler);

module.exports = {
  exchangeSlugForUser,
  UserController,
};
