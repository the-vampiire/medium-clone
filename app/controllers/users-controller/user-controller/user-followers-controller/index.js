const express = require('express');

const { requireAuthedUser } = require('../../../auth-utils');
const { followUserHandler, userFollowersHandler } = require('./user-followers-route-handlers');
const { UserFollowerController, exchangeSlugForFollower } = require('./user-follower-controller');

// controls: /users/:usernameSlug/followers/
const UserFollowersController = express.Router();

UserFollowersController.get('/', userFollowersHandler);
UserFollowersController.post('/', requireAuthedUser, followUserHandler);

// controls: /users/:usernameSlug/followers/:followerSlug/
UserFollowersController.use('/:followerSlug', exchangeSlugForFollower, UserFollowerController);

module.exports = {
  UserFollowersController,
};