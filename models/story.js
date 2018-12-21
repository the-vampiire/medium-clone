const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  title: String,
  body: String,
  clapCount: {
    type: Number,
    default: 0,
  },
  author: { type: mongoose.SchemaTypes.ObjectId, ref: 'User' },
  parent: { type: mongoose.SchemaTypes.ObjectId, ref: 'Story' },
  replies: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'Story' }],
  claps: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'Clap' }],
});

const Story = mongoose.model('Story', storySchema);

module.exports = Story;
