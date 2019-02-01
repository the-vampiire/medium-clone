const express = require('express');
const UserController = require('./user-controller');
const { verifyPayload, checkDuplicate, registerUser } = require('./user-registration');
const { exchangeSlugForUser, userNotFoundRedirect } = require('./user-controller-middleware');

const UsersController = express.Router();

// POST /users (registration)
UsersController.post(
  '/',
  verifyPayload,
  checkDuplicate,
  registerUser,
);

// /users/:usernameSlug MW and Controller
UsersController.use(
  '/:usernameSlug',
  exchangeSlugForUser,
  userNotFoundRedirect,
  UserController,
);

module.exports = UsersController;

