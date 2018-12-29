const mongoose = require('mongoose');
const { buildEndpoint } = require('../controllers/utils');
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

/**
 * @param {User} author the pathUser who authored the Story 
 * @returns
 *  { id: '5c26a115dcc1c40354e18a20',
      createdAt: 2018-12-28T22:17:57.174Z,
      updatedAt: 2018-12-28T22:17:57.174Z,
      publishedDate: null,
      published: false,
      clapsCount: 10,
      repliesCount: 1,
      author:
       { id: '5c26a115dcc1c40354e18a1c',
         username: 'houston',
         avatarURL: 'https://s3.amazonaws.com/uifaces/faces/twitter/jasonmarkjones/128.jpg',
         resources:
          { userURL: 'http://localhost:8080/user/@houston',
            followersURL: 'http://localhost:8080/user/@houston/followers',
            followingURL: 'http://localhost:8080/user/@houston/following',
            storiesURL: 'http://localhost:8080/user/@houston/stories?limit=10&page=0',
            responsesURL: 'http://localhost:8080/user/@houston/responses?limit=10&page=0',
            clappedStoriesURL: 'http://localhost:8080/user/@houston/clapped?limit=10&page=0' } },
      title: 'Universal solution-oriented hardware',
      body: 'Laudantium deserunt dicta aliquid blanditiis qui. Est ipsum earum possimus qui nemo ipsum et. Ut hic culpa. Eaque et perspiciatis quos esse. Quo beatae assumenda sequi. Eligendi molestiae facere.\n \rOdit non et ab qui reprehenderit dignissimos ex et veniam. Suscipit pariatur earum est. Consequuntur et ullam vel.',
      resources:
       { storyURL: 'http://localhost:8080/story/universal-solution-oriented-hardware-5c26a115dcc1c40354e18a20',
         parentURL: null,
         repliesURL: 'http://localhost:8080/story/universal-solution-oriented-hardware-5c26a115dcc1c40354e18a20/replies?limit=10&page=0',
         clappedUsersURL: 'http://localhost:8080/story/universal-solution-oriented-hardware-5c26a115dcc1c40354e18a20/clapped?limit=10&page=0' } }
 */
storySchema.methods.toResponseShape = async function toResponseShape(author) {
  const populated = await this.populate('repliesCount').execPopulate();
  const storyResponse = populated.toJSON();

  // todo: get viewing user (reader) from request
  // const readerClap = await this.model('claps').findOne(
  //   { user: reader, story: this },
  //   'count',
  // );

  // shape response fields
  storyResponse.id = storyResponse._id.toHexString();
  storyResponse.clapsCount = await this.getClapsCount();
  // todo: implement and tests
  // storyResponse.readerClapsCount = readerClap ? readerClap.count : null;
  storyResponse.resources = await this.buildResourceLinks();
  storyResponse.author = {
    id: author.id,
    username: author.username,
    avatarURL: author.avatarURL,
    resources: author.buildResourceLinks(),
  };

  // clean up unused fields
  delete storyResponse.__v;
  delete storyResponse._id;
  delete storyResponse.parent;

  // todo: add next and next_page_url properties
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

  this.publishedDate = Date.now();
  this.published = true;
  return this.save();
}

const Story = mongoose.model('stories', storySchema);

module.exports = Story;

const fields = ["id", "createdAt", "updatedAt", "published", "publishedDate", "clapsCount", "repliesCount", "author", "title", "body", "resources"];