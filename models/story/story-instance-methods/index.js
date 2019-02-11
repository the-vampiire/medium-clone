const queryMethods = require('./story-instance-queries');
const shaperMethods = require('./story-instance-shapers');

module.exports = {
  ...queryMethods,
  ...shaperMethods,
};
