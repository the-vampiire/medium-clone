const mongoose = require('mongoose');

const clapSchema = new mongoose.Schema({
  count: Number,
  user: mongoose.SchemaTypes.ObjectId,
  story: mongoose.SchemaTypes.ObjectId,
});

const Clap = mongoose.model('Clap', clapSchema);

module.exports = Clap;
