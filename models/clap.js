const mongoose = require('mongoose');

const clapSchema = new mongoose.Schema({
  count: Number,
  user: { type: mongoose.SchemaTypes.ObjectId, ref: 'users' },
  story: { type: mongoose.SchemaTypes.ObjectId, ref: 'stories' },
});

const Clap = mongoose.model('claps', clapSchema);

module.exports = Clap;
