const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  title: String,
  body: String,
  author: { type: mongoose.SchemaTypes.ObjectId, ref: 'users' },
  parent: { type: mongoose.SchemaTypes.ObjectId, ref: 'stories' },
});

// https://mongoosejs.com/docs/api.html#schema_Schema-virtual
storySchema.virtual('claps', {
  ref: 'claps', // collection name this [claps] field references
  localField: '_id', // the ID to of this story
  foreignField: 'story', // the field on the Clap document to match with the ID
});

storySchema.virtual('clapsCount', {
  ref: 'claps', // collection name this [claps] field references
  localField: '_id', // the ID to of this story
  foreignField: 'story', // the field on the Clap document to match with the ID
  count: true, // only return a the total number of claps not the Clap documents themselves
});

storySchema.virtual('replies', {
  ref: 'stories', // collection name this [Story] field references
  localField: '_id', // the ID to of this story
  foreignField: 'parent', // the field on the Clap document to match with the ID
});

storySchema.virtual('repliesCount', {
  ref: 'stories', // collection name this [Story] field references
  localField: '_id', // the ID to of this story
  foreignField: 'replies', // the field on the Reply [Story] document to match with the ID
  count: true, // only return a the total number of Replies not the Reply documents themselves
});

const Story = mongoose.model('stories', storySchema);

module.exports = Story;
