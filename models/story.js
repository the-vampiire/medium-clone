const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  title: String,
  body: String,
  author: mongoose.SchemaTypes.ObjectId,
  parent: mongoose.SchemaTypes.ObjectId,
  replies: [mongoose.SchemaTypes.ObjectId],
  claps: [mongoose.SchemaTypes.ObjectId],
});

const Story = mongoose.model('Story', storySchema);

module.exports = Story;
