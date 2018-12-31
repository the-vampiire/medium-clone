const utils = require('./user-instance-utils');
const queries = require('./user-instance-queries');
const mutations = require('./user-instance-mutations');

module.exports = {
  ...utils,
  ...queries,
  ...mutations,
};