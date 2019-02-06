const mongoose = require('mongoose');
const sanitizeHTML = require('sanitize-html');

const staticMethods = require('./story-static-methods');
const instanceMethods = require('./story-instance-methods');

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
  publishedAt: {
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

// -- VIRTUALS -- //
storySchema.virtual('claps', {
  ref: 'claps', // collection name this [claps] field references
  localField: '_id', // the ID to of this story
  foreignField: 'story', // the field on the Clap document to match with the ID
});

storySchema.virtual('clappedUserCount', {
  ref: 'claps', // collection name this [claps] field references
  localField: '_id', // the ID to of this story
  foreignField: 'story', // the field on the Clap document to match with the ID
  count: true,
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
storySchema.virtual('slug').get(function() {
  // replaces ' ' with '-' and convert to lower case
  const stripped = this.title.replace(/ /g, '-').toLowerCase();
  return `${stripped}-${this.id}`;
});

// -- HOOKS -- //
// TODO: tests
storySchema.pre('save', function sanitizeBody() {
  this.body = sanitizeHTML(this.body);
});

// -- INSTANCE METHODS -- //
for (const [methodName, method] of Object.entries(instanceMethods)) {
  // sets the external methods on the schema, userSchena.methods = methods fails
  storySchema.methods[methodName] = method;
}

// -- STATIC METHODS -- //
for (const [methodName, method] of Object.entries(staticMethods)) {
  storySchema.statics[methodName] = method;
}

const Story = mongoose.model('stories', storySchema);

module.exports = Story;
