const queryMethods = require('./user-instance-queries');
const shaperMethods = require('./user-instance-shapers');
const mutationMethods = require('./user-instance-mutations');

module.exports = {
  ...queryMethods,
  ...shaperMethods,
  ...mutationMethods,
};