const express = require('express');

const { exchangeSlugForUser, UserController, } = require('./user-controller');
const {
  verifyRegistrationPayload,
  checkDuplicateRegistration,
  registerUserHandler,
} = require('./user-registration');

const UsersController = express.Router();

// POST /users (registration) MW and handler
UsersController.post(
  '/',
  verifyRegistrationPayload,
  checkDuplicateRegistration,
  registerUserHandler,
);

// /users/:usernameSlug/ MW and Controller
UsersController.use(
  '/:usernameSlug',
  exchangeSlugForUser,
  UserController,
);

module.exports = UsersController;

