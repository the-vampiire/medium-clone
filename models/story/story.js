const mongoose = require('mongoose');
const sanitizeHTML = require('sanitize-html');
const { buildEndpoint } = require('../../controllers/controller-utils');
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

storySchema.methods.toResponseShape = async function toResponseShape() {
  const populated = await this.populate('repliesCount').populate('author').execPopulate();
  const storyResponse = populated.toJSON();

  // todo: get viewing user (reader) from request
  // const readerClap = await this.model('claps').findOne(
  //   { user: reader, story: this },
  //   'count',
  // );
  // todo: implement and tests
  // storyResponse.readerClapsCount = readerClap ? readerClap.count : null;

  // shape response fields
  storyResponse.slug = this.slug;
  storyResponse.author = this.author.toResponseShape();
  storyResponse.clapsCount = await this.getClapsCount();
  storyResponse.links = await this.buildResourceLinks();

  // clean up unused fields
  delete storyResponse.__v;
  delete storyResponse._id;
  delete storyResponse.parent;

  return storyResponse;
}

storySchema.methods.buildResourceLinks = async function buildResourceLinks() {
  const basePath = `stories/${this.slug}`;
  
  const populated = await this
    .populate('repliesCount')
    .populate('clappedUserCount')
    .populate('parent', 'title')
    .execPopulate();

  // 'count' virtuals are only accessible after converting to JSON
  const { repliesCount, clappedUserCount } = populated.toJSON();

  // need parent Story object to call .slug virtual, cant access from JSON
  const parent = populated.parent;

  const storyURL = buildEndpoint({ basePath });

  const parentURL = parent 
    ? buildEndpoint({ basePath: `story/${parent.slug}` })
    : null;

  const repliesURL = repliesCount
    ? buildEndpoint({ basePath, path: 'replies', paginated: true })
    : null;

  const clappedUsersURL = clappedUserCount
    ? buildEndpoint({ basePath, path: 'clapped', paginated: true })
    : null;

  return {
    storyURL,
    parentURL,
    repliesURL,
    clappedUsersURL,
  };
};

// -- SETTERS -- //
storySchema.methods.publish = function publish() {
  if (this.published) return null;

  this.publishedAt = Date.now();
  this.published = true;
  return this.save();
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
