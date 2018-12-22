const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  avatar_url: String,
});

// -- VIRTUALS -- //
userSchema.virtual('stories', {
  ref: 'stories',
  localField: '_id',
  foreignField: 'author',
});

userSchema.virtual('claps', {
  ref: 'claps',
  localField: '_id',
  foreignField: 'user',
});

// all the Follow docs of users following this one
userSchema.virtual('followersList', { 
  ref: 'follows',
  localField: '_id',
  foreignField: 'followedUser',
});

// all the Follow docs of users being followed by this one
userSchema.virtual('followingList', { 
  ref: 'follows',
  localField: '_id',
  foreignField: 'follower',
});

// == HOOKS -- //
// rule of thumb: the owner model (User) is responsible for cleaning up its owned relations (Story, Clap, Follow)
// User owns: stories, claps, follows
userSchema.pre(
  'remove', // when user [User document instance] has .remove() called on it
  function cascadeDelete() {
    return mongoose.model('follows').remove({
      // destroy follows where the user is either a follower or being followed
      $or: [{ followedUser: this.id }, { follower: this.id }],
    })
    .then(() => mongoose.model('stories').remove({ author: this.id }))
    .then(() => mongoose.model('claps').remove({ user: this.id }))
  },
);

// -- INSTANCE METHODS -- //
// -- GETTERS -- //
userSchema.methods.getStories = function getStories() {
  return this.populate('stories').execPopulate().then(user => user.stories);
}

userSchema.methods.getClaps = function getClaps() {
  return this.populate('claps').execPopulate().then(user => user.claps);
}

userSchema.methods.getFollowers = async function getFollowers() {
  // this is an array of Follow document objects with shape { followedUser, follower }
  const followersList = await this.populate('followersList').execPopulate().then(user => user.followersList);
  // here we need to convert this [Follow] array into a [User] array representing the follewer Users
  return Promise.all(
    // we iterate over each Follow object and populate its 'follower' [User] property
    followersList.map(follow => follow.populate('follower').execPopulate()
      .then(follow => follow.follower)), // then we return just the User object itself
  );
}

userSchema.methods.getFollowing = async function getFollowing() {
  // this is an array of Follow document objects with shape { followedUser, follower }
  // each of these fields holds a reference to the corresponding User id
  const followingList = await this.populate('followingList').execPopulate().then(user => user.followingList);

  // we need to convert this [Follow] array into a [User] array representing the Users this user follows
  return Promise.all(
    // we iterate over each Follow object and populate its 'followedUser' [User] property
    followingList.map(follow => follow.populate('followedUser').execPopulate()
      .then(follow => follow.followedUser)), // then we return just the User object itself
  );
}

userSchema.methods.getResponses = function getResponses() {
  // cant use simple virtual because responses are modeled as Story documents
  // they have a 'parent' field that references their parent story
  // because we need to apply a condition t o our 
  return mongoose.model('stories').find({
    parent: { $ne: null }, // responses have parent fields defined
    author: this._id,
  });
}

// -- SETTERS -- //
userSchema.methods.followUser = function followUser(followedUser) {
  if (this.id === followedUser.id) return null;
  return mongoose.model('follows').create({
    followedUser,
    follower: this,
  });
}

const User = mongoose.model('users', userSchema);

module.exports = User;
