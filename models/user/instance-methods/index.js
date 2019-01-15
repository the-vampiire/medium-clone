const shapers = require('./user-instance-shapers');
const queries = require('./user-instance-queries');
const mutations = require('./user-instance-mutations');

module.exports = {
  ...shapers,
  ...queries,
  ...mutations,
};