const mongoose = require('mongoose');

const clapSchema = new mongoose.Schema({
  count: Number,
  user: { type: mongoose.SchemaTypes.ObjectId, ref: 'User' },
  story: { type: mongoose.SchemaTypes.ObjectId, ref: 'Story' },
});

const Clap = mongoose.model('Clap', clapSchema);

module.exports = Clap;
