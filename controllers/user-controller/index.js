const express = require('express');
const UserFollowersController = require('./user-followers-controller');
const { exchangeSlugForUser, userNotFoundRedirect } = require('./user-controller-middleware');

const UserController = express.Router();

UserController.use('/:usernameSlug', exchangeSlugForUser, userNotFoundRedirect);

UserController.use('/followers', UserFollowersController);

UserController.get('/stories', (req, res) => {});
UserController.get('/following', (req, res) => {});
UserController.get('/responses', (req, res) => {});

module.exports = UserController;