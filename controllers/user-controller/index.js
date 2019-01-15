const express = require('express');

const UserFollowController = require('./user-follow-controller');
const UserControllerMiddleware = require('./user-controller-middleware');
const routeHandlers = require('./user-route-handlers');

// handles all requests prefixed by: /user/
const UserController = express.Router();

// handles the GET/POST/DELETE routes of /user/@username/follow/
// GET: no content, 200 if following, 404 if not
UserController.use('/follow', UserFollowController);

// UserController.get('/', userDiscoveryHandler);
UserController.get('/stories', routeHandlers.stories);
UserController.get('/responses', routeHandlers.responses);
UserController.get('/following', routeHandlers.following);
UserController.get('/clapped', routeHandlers.clappedStories);
// UserController.get('/followers', userFollowersHandler);

module.exports = {
  UserController,
  UserControllerMiddleware,
};
