const express = require('express');

// const UserFollowersController = require('./user-follow-controller'); // WIP
const { exchangeSlugForUser } = require('./user-controller-middleware');
const {
  userStoriesHandler,
  userFollowingHandler,
  userDiscoveryHandler,
  userResponsesHandler,
  userClappedStoriesHandler,
} = require('./user-route-handlers');

// controls: /users/:usernameSlug/
const UserController = express.Router();

UserController.get('/', userDiscoveryHandler);
UserController.get('/stories', userStoriesHandler);
UserController.get('/responses', userResponsesHandler);
UserController.get('/clapped', userClappedStoriesHandler);
UserController.get('/following', userFollowingHandler);
// UserController.use('/followers', UserFollowersController); // WIP

module.exports = {
  exchangeSlugForUser,
  UserController,
};
