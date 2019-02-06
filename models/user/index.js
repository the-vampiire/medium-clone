const { User, SALT_ROUNDS } = require('./user');
const instanceMethods = require('./user-instance-methods');

module.exports = {
  User,
  SALT_ROUNDS,
  instanceMethods,
};
