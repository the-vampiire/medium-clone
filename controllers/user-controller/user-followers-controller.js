const express = require('express');
const { requireAuthedUser } = require('../../middleware');

const UserFollowersController = express.Router();

UserFollowersController.get((req, res) => {});
UserFollowersController.post(requireAuthedUser, (req, res) => {});
UserFollowersController.delete(requireAuthedUser, (req, res) => {});

module.exports = UserFollowersController;