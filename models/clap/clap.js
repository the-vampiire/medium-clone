const mongoose = require('mongoose');
const { toResponseShape, buildResourceLinks } = require('./clap-instance-shapers');

/* MAGIC NUMBER */
const MAX_CLAP_COUNT = 50;

const clapSchema = new mongoose.Schema({
  count: {
    type: Number,
    default: 1,
    min: 1,
    max: MAX_CLAP_COUNT,
  },
  reader: { type: mongoose.SchemaTypes.ObjectId, ref: 'users' },
  story: { type: mongoose.SchemaTypes.ObjectId, ref: 'stories' },
}, { timestamps: true });

// -- INSTANCE METHODS -- //
clapSchema.methods.toResponseShape = toResponseShape;
clapSchema.methods.buildResourceLinks = buildResourceLinks;

const Clap = mongoose.model('claps', clapSchema);

module.exports = {
  Clap,
  MAX_CLAP_COUNT,
};
