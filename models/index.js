const { Clap, MAX_CLAP_COUNT } = require('./clap');
const { User } = require('./user');
const { Story } = require('./story');

module.exports = {
  User,
  Story,
  Clap,
  constants: {
    MAX_CLAP_COUNT,
  },
};
