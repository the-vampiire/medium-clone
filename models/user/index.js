const { User, SALT_ROUNDS } = require('./user');
const instanceMethods = require('./instance-methods');

module.exports = {
  User,
  SALT_ROUNDS,
  instanceMethods,
};
