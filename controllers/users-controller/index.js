const express = require('express');
const UserController = require('./user-controller');
const UserControllerMiddleware = require('./user-controller-middleware');

// controls: /users
const UsersController = express.Router();

// UsersController.post('/', registerUser);
UsersController.use('/:usernameSlug', ...UserControllerMiddleware, UserController);

module.exports = UsersController;

