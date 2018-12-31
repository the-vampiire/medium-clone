const mongoose = require('mongoose');
const { MAX_CLAP_COUNT } = require('./clap');
const { buildEndpoint } = require('../controllers/utils');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    set: val => val.toLowerCase(),
  },
  avatarURL: String,
  followers: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'users' }],
  following: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'users' }],
}, { timestamps: true });

// -- VIRTUALS -- //
userSchema.virtual('claps', {
  ref: 'claps',
  localField: '_id',
  foreignField: 'user',
});

userSchema.virtual('slug').get(function () {
  return `@${this.username}`;
});

// == HOOKS -- //
// rule of thumb: the owner model (User) is responsible for cleaning up its owned relations (Story, Clap, Follow)
// User owns: stories, claps, follows
userSchema.pre(
  'remove', // when user [User document instance] has .remove() called on it
  function cascadeDelete() {
    return mongoose.model('stories').remove({ author: this.id })
    .then(() => mongoose.model('claps').remove({ user: this.id }))
  },
);

// -- INSTANCE METHODS -- //
// -- GETTERS -- //
/**
 * multi-purpose getter for authored stories
 * @param StoryQueryOptions
 * @property {Number} limit [10] pagination, MAX 20: use Story.find({ author }) for larger internal queries
 * @property {Number} currentPage [0] pagination
 * @property {Boolean} published [true] story's published field
 * @property {Boolean} onlyStories [false] only original stories
 * @property {Boolean} onlyResponses [false] only responses to stories
 * @property {object} sortBy [published: true -> { publishedDate: -1 }, published: false -> { updatedAt: -1 }] sort by Story field
 */
userSchema.methods.getStories = async function getStories({
  limit = 10,
  currentPage = 0,
  published = true,
  onlyStories = false,
  onlyResponses = false,
  sortBy = {},
}) {
  const match = { author: this, published };
  if (onlyStories) match.parent = null;
  else if (onlyResponses) match.parent = { $ne: null };

  const sortByEmpty = Object.keys(sortBy).length === 0;
  // published stories and no sortBy option defined -> default sort by published date desc
  if (published && sortByEmpty) sortBy.publishedAt = -1;
  // unpublished stories and no sortBy option defined -> default sort by updated date desc
  else if (!published && sortByEmpty) sortBy.updatedAt = -1;

/* MAX STORY DOCUMENTS LIMIT: use Story.find({ author }) for larger internal queries */
  const limitBy = Math.min(limit, 20); // limit max request to 20 documents
  const skipBy = currentPage * limitBy;

  return this.model('stories')
    .find(match)
    .sort(sortBy)
    .limit(limitBy)
    .skip(skipBy);
}

// todo: getClaps()? -> { count, story }
userSchema.methods.getClappedStories = function getClappedStories(limit, currentPage) {
  const limitBy = limit || 10;
  const skipBy = (currentPage || 0) * limitBy;
  // retrieve the list of [Story] through the associated claps
  return this
    .populate({
      path: 'claps',
      options: {
        limit: limitBy,
        skip: skipBy,
        sort: { createdAt: -1 },
      },
    })
    .execPopulate()
    // get the users claps
    .then(user => user.claps)
    // for each clap populate the 'story' field
    .then(claps => Promise.all(claps.map(
      clap => clap.populate('story').execPopulate()
      // return the story
      .then(clap => clap.story)
    )));
}

// -- SETTERS -- //
userSchema.methods.followUser = async function followUser(followedUserID) {
  // user can not follow themselves or the universe will implode from recursive nesting
  if (this.id === followedUserID) return null; // our savior, NullMan
  
  // check if the user is already following
  // following is an array of ObjectId, convert to String before comparing
  const isFollowing = this.following.some(id => String(id) === followedUserID);
  if (isFollowing) return null;

  const followedUser = await User.findById(followedUserID);
  if (!followedUser) return null;

  // push 'this' (current user) into the followedUser followers array field
  followedUser.followers.push(this);
  // save the changes to the followedUser then update 'this' user
  return followedUser.save()
    // update 'this' current users following array field
    .then(followedUser => this.following.push(followedUser))
    // save and return the updated user
    .then(() => this.save());
}

userSchema.methods.clapForStory = async function clapForStory(storyID, totalClaps) {
  // reject negative values
  if (totalClaps < 1) return null;

  // limit the maximum count
  const count = totalClaps <= MAX_CLAP_COUNT ? totalClaps : MAX_CLAP_COUNT;

  const story = await this.model('stories').findById(storyID);
  // reject if a story is not found
  if (!story) return null;
  // reject authors clapping for their own story
  else if (String(story.author) === this.id) return null;

  // creates or updates the count of a reader's (user) story clap
  return this.model('claps').update(
    { user: this, story }, // identifier for the update
    { $set: { count } }, // operation to perform on the found/created document
    { upsert: true }, // upsert means update if exists or insert if not
  );
}

userSchema.methods.respondToStory = async function respondToStory(storyID, body) {
  const Story = this.model('stories');

  const story = await Story.findOne({ _id: storyID }, '_id');
  if (!story) return null; // does not exist

  return Story.create({
    body,
    author: this,
    parent: story,
    published: true,
  });
}

// -- UTILITIES -- //
userSchema.methods.buildResourceLinks = function buildResourceLinks() {
  const basePath = `user/${this.slug}`;
  return {
    userURL: buildEndpoint({ basePath }),
    followersURL: buildEndpoint({ basePath, path: 'followers', paginated: true }),
    followingURL: buildEndpoint({ basePath, path: 'following', paginated: true }),
    storiesURL: buildEndpoint({ basePath, path: 'stories', paginated: true }),
    responsesURL: buildEndpoint({ basePath, path: 'responses', paginated: true }),
    clappedStoriesURL: buildEndpoint({ basePath, path: 'clapped', paginated: true }),
  };
}

userSchema.methods.shapeAuthoredStories = function shapeAuthoredStories(stories) {
  return Promise.all(
    stories.map(story => story.toResponseShape({ author: this }))
  );
}

userSchema.methods.addStoriesPagination = async function addStoriesPagination({
  limit,
  currentPage,
  stories,
  published = true,
  responses = false,
}) {
  const match = { author: this, published };
  if (responses) match.parent = { $ne: null };
  else match.parent = null;

  return this.addPagination({
    limit,
    currentPage,
    path: 'stories',
    output: { stories },
    totalDocuments: await this.model('stories').countDocuments(match).exec(),
  });
}

// todo: tests
userSchema.methods.addPagination = async function addPagination({
  path,
  output = {},
  limit = 10,
  currentPage = 0,
  totalDocuments,
}) {
  const paginatedOutput = { ...output };
  paginatedOutput.pagination = { limit, currentPage, hasNext: null, nextPageURL: null };

  const nextPage = currentPage + 1;
  const hasNext = totalDocuments > nextPage * limit;

  if (hasNext) {
    paginatedOutput.pagination.hasNext = hasNext;
    paginatedOutput.pagination.nextPageURL = buildEndpoint({
      path,
      limit,
      currentPage: nextPage,
      basePath: `user/${this.slug}`,
    });
  }

  return paginatedOutput;
};

const User = mongoose.model('users', userSchema);

module.exports = User;
