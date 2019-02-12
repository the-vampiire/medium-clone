const express = require('express');

const { requireAuthedUser } = require('../../../require-authed-user');
const { UserFollowerController } = require('./user-follower-controller');
const { followUserHandler, userFollowersHandler } = require('./user-followers-route-handlers');

// controls: /users/:usernameSlug/followers/
const UserFollowersController = express.Router();

UserFollowersController.get(userFollowersHandler);

UserFollowersController.post(requireAuthedUser, followUserHandler);

// controls: /users/:usernameSlug/followers/:followerSlug/
UserFollowersController.use('/:followerSlug', UserFollowerController);

module.exports = {
  UserFollowersController,
};