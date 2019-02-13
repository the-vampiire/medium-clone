const express = require('express');

const { requireAuthedUser } = require('../../../../require-authed-user');
const { requireFollowOwnership } = require('./user-follower-middleware');
const { isFollowingHandler, unfollowUserHandler } = require('./user-follower-route-handlers');

const UserFollowerController = express.Router();

UserFollowerController.get('/', isFollowingHandler);

UserFollowerController.delete(
  '/',
  requireAuthedUser,
  requireFollowOwnership,
  unfollowUserHandler,
);

module.exports = {
  UserFollowerController,
};
