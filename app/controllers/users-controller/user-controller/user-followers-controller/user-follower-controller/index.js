const express = require('express');

const { requireAuthedUser } = require('../../../../require-authed-user');
const { isFollowingHandler, unfollowUserHandler } = require('./user-follower-route-handlers');
const { requireFollowOwnership, exchangeSlugForFollower } = require('./user-follower-middleware');

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
  exchangeSlugForFollower,
};
