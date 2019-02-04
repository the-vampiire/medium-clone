const mongoose = require('mongoose');
const sanitizeHTML = require('sanitize-html');

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

// https://mongoosejs.com/docs/api.html#schema_Schema-virtual
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
// storySchema.statics.getLatestStories = async function getLatestStories(query) {
//   const { limit = 10, currentPage = 0 } = query;

//   // limit to max of 20 results per page
//   const limitBy = Math.max(limit, 20);
//   const skipBy = limitBy * currentPage;

//   const latestStories = await models.Story
//     .find({ published: true })
//     .sort({ publishedAt: -1 })
//     .limit(limitBy)
//     .skip(skipBy);

//   const stories = await Promise.all(latestStories.map(story => story.toResponseShape()));
//   return { stories, pagination };
// }

const Story = mongoose.model('stories', storySchema);

module.exports = Story;
