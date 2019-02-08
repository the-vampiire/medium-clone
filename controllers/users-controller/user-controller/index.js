const express = require('express');

// const UserFollowersController = require('./user-follow-controller'); // WIP
const { exchangeSlugForUser } = require('./user-controller-middleware');
const {
  userDiscoveryHandler,
  userStoriesHandler,
  userResponsesHandler,
} = require('./user-route-handlers');

// controls: /users/:usernameSlug/
const UserController = express.Router();

UserController.get('/', userDiscoveryHandler);
UserController.get('/stories', userStoriesHandler);
UserController.get('/responses', userResponsesHandler);
// UserController.get('/following', userFollowingHandler); // WIP
// UserController.use('/followers', UserFollowersController); // WIP
// UserController.get('/clapped', userClappedStoriesHandler); // WIP

module.exports = {
  exchangeSlugForUser,
  UserController,
};
