const queryMethods = require('./story-static-queries');
const shaperMethods = require('./story-static-shapers');

module.exports = {
  ...queryMethods,
  ...shaperMethods,
};
