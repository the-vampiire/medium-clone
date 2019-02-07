const express = require('express');
const { verifyPayload, checkDuplicate, registerUser } = require('./user-registration');
const { exchangeSlugForUser, UserController, } = require('./user-controller');

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
  UserController,
);

module.exports = UsersController;

