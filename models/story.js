const mongoose = require('mongoose');
const { buildEndpoint } = require('../controllers/controller-utils');
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

storySchema.methods.toResponseShape = async function toResponseShape({ author }) {
  const populated = await this.populate('repliesCount').execPopulate();
  const storyResponse = populated.toJSON();

  // todo: get viewing user (reader) from request
  // const readerClap = await this.model('claps').findOne(
  //   { user: reader, story: this },
  //   'count',
  // );
  // todo: implement and tests
  // storyResponse.readerClapsCount = readerClap ? readerClap.count : null;

  // shape response fields
  storyResponse.author = author.toResponseShape();
  storyResponse.id = storyResponse._id.toHexString();
  storyResponse.clapsCount = await this.getClapsCount();
  storyResponse.links = await this.buildResourceLinks();

  // clean up unused fields
  delete storyResponse.__v;
  delete storyResponse._id;
  delete storyResponse.parent;

  return storyResponse;
}

storySchema.methods.buildResourceLinks = async function buildResourceLinks() {
  const basePath = `story/${this.slug}`;
  
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

const Story = mongoose.model('stories', storySchema);

module.exports = Story;
