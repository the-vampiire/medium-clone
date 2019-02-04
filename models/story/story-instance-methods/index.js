const queryMethods = require('./story-instance-queries');
const shaperMethods = require('./story-instance-shapers');
const mutationMethods = require('./story-instance-mutations');

module.exports = {
  ...queryMethods,
  ...shaperMethods,
  ...mutationMethods,
};
