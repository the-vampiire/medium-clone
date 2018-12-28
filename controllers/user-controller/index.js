const express = require('express');
const UserFollowersController = require('./user-followers-controller');
const {
  exchangeSlugForUser,
  userNotFoundRedirect,
} = require('./user-controller-middleware');
const {
  userStoriesHandler,
  userFollowingHandler,
  userResponsesHandler,
  userClappedHandler,
} = require('./user-route-handlers');

// handles all requests prefixed by: /user/
const UserController = express.Router();

// require all routes in the UserController to have a username slug (@username) prefix
// use this slug to get the corresponding user or redirect if they dont exist
// this middleware chain is executed for every request prefixed by: /user/@username/
UserController.use('/:usernameSlug', exchangeSlugForUser, userNotFoundRedirect);

// handles the GET/POST/DELETE routes of /user/@username/followers/
UserController.use('/followers', UserFollowersController);

UserController.get('/stories', userStoriesHandler);
UserController.get('/following', userFollowingHandler);
UserController.get('/responses', userResponsesHandler);
UserController.get('/clapped', userClappedHandler);

module.exports = UserController;
