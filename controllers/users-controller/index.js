const express = require('express');
const { exchangeSlugForUser, userNotFoundRedirect, UserController, } = require('./user-controller');
const { verifyPayload, checkDuplicate, registerUser } = require('./user-registration');

const UsersController = express.Router();

// POST /users (registration) MW and handler
UsersController.post(
  '/',
  verifyPayload,
  checkDuplicate,
  registerUser,
);

// /users/:usernameSlug/ MW and Controller
UsersController.use(
  '/:usernameSlug',
  exchangeSlugForUser,
  userNotFoundRedirect,
  UserController,
);

module.exports = UsersController;

