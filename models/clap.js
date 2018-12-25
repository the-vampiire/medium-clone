const mongoose = require('mongoose');

/* MAGIC NUMBER */
const MAX_CLAP_COUNT = 50;

const clapSchema = new mongoose.Schema({
  count: {
    type: Number,
    default: 1,
    min: 1,
    max: MAX_CLAP_COUNT,
  },
  user: { type: mongoose.SchemaTypes.ObjectId, ref: 'users' },
  story: { type: mongoose.SchemaTypes.ObjectId, ref: 'stories' },
});

const Clap = mongoose.model('claps', clapSchema);

module.exports = {
  Clap,
  MAX_CLAP_COUNT,
};
