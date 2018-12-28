const mongoose = require('mongoose');

// idea: future
// const draftSchema = new mongoose.Schema({
//   title: String,
//   body: String,
//   saveDate: Date,
// });

// const highlightSchema = new mongoose.Schema({
//   text: String,
//   users: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'users' }],
// });

const storySchema = new mongoose.Schema({
  title: String,
  body: String,
  publishedDate: {
    type: Date,
    default: null,
  },
  published: { // true: published, false: draft
    type: Boolean,
    default: false,
  },
  author: { type: mongoose.SchemaTypes.ObjectId, ref: 'users' },
  parent: { type: mongoose.SchemaTypes.ObjectId, ref: 'stories' },
  // idea: future
  // drafts: [draftSchema],
  // highlights: [highlightSchema],
}, { timestamps: true });

// https://mongoosejs.com/docs/api.html#schema_Schema-virtual
storySchema.virtual('claps', {
  ref: 'claps', // collection name this [claps] field references
  localField: '_id', // the ID to of this story
  foreignField: 'story', // the field on the Clap document to match with the ID
});

storySchema.virtual('replies', {
  ref: 'stories', // collection name this [Story] field references
  localField: '_id', // the ID to of this story
  foreignField: 'parent', // the field on the Clap document to match with the ID
});

storySchema.virtual('repliesCount', {
  ref: 'stories', // collection name this [Story] field references
  localField: '_id', // the ID to of this story
  foreignField: 'parent', // the field on the Clap document to match with the ID
  count: true,
});

// used for generating the url slug of the story
// creates a virtual getter method for the 'slug' property
// todo: update tests
storySchema.virtual('slug').get(function() {
  // replaces ' ' with '-' and convert to lower case
  const stripped = this.title.replace(/ /g, '-').toLowerCase();
  return `${stripped}-${this.id}`;
});

// -- INSTANCE METHODS -- //
// -- GETTERS -- //
storySchema.methods.getClapsCount = function getClapsCount() {
  const reduceClapsCount = claps => claps.reduce((total, clap) => total + clap.count, 0);
  
  return this.populate('claps').execPopulate()
    .then(() => reduceClapsCount(this.claps));
}

storySchema.methods.getClappedReaders = function getClappedReaders() {
  const mapClappedUsers = claps => Promise.all(
    claps.map(clap => clap.populate('user').execPopulate().then(clap => clap.user)),
  );
  return this.populate('claps').execPopulate().then(() => mapClappedUsers(this.claps));
}

// -- SETTERS -- //
storySchema.methods.publish = function publish() {
  if (this.published) return null;

  this.publishedDate = Date.now();
  this.published = true;
  return this.save();
}

const Story = mongoose.model('stories', storySchema);

module.exports = Story;
