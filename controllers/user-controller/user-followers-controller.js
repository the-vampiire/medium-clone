const express = require('express');
// all route handlers that requireAuthedUser will have this middleware executed first
// if there is no authenticated user then the request will be rejected before reaching
// the route handler
const { requireAuthedUser } = require('../../shared-middleware');

const UserFollowersController = express.Router();

UserFollowersController.get((req, res) => {});

UserFollowersController.post(requireAuthedUser, (req, res) => {});

UserFollowersController.delete(requireAuthedUser, (req, res) => {});

module.exports = UserFollowersController;