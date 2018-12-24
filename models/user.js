const mongoose = require('mongoose');
const { MAX_CLAP_COUNT } = require('./clap');

const userSchema = new mongoose.Schema({
  username: String,
  avatar_url: String,
  followers: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'users' }],
  following: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'users' }],
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
userSchema.methods.getStories = function getStories() {
  return this.populate('stories').execPopulate().then(user => user.stories);
}

userSchema.methods.getClappedStories = function getClappedStories() {
  // retrieve the list of [Story] through the associated claps
  return this.populate('claps').execPopulate()
    // get the users claps
    .then(user => user.claps)
    // for each clap populate the 'story' field
    .then(claps => Promise.all(claps.map(
      clap => clap.populate('story').execPopulate()
      // return the story
      .then(clap => clap.story)
    )));
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

userSchema.methods.clapForStory = function clapForStory(storyID, totalClaps) {
  // reject negative values
  if (totalClaps < 1) return null;

  // limit the maximum count
  const count = totalClaps <= MAX_CLAP_COUNT ? totalClaps : MAX_CLAP_COUNT;

  // creates or updates the count of a reader's (user) story clap
  return this.model('claps').update(
    { user: this, story: storyID }, // identifier for the update
    { $set: { count } }, // operation to perform on the found/created document
    { upsert: true }, // upsert means update if exists or insert if not
  );
}

const User = mongoose.model('users', userSchema);

module.exports = User;

/**
 * 
 * two approaches to modeling a follower / following relationship between users in mongo
 * 
 * we could store 'followers' and 'following' array fields on the User
 * these would hold references to the users they follow or are followed by respectively
 * 
 * getting followers [1 loop over smaller collection]:
 *   look up the user's document and populate the 'followers' list field
 * 
 * getting following [1 loop over smaller collection]:
 *   look up the user's document and populate the 'following' list field
 * 
 * making a connection (following / being followed):
 *   follow [1 loop over smaller collection]:
 *     look up the other user and push the current user's ID into the other user's 'followers' list
 *   following[1 loop over smaller collection]:
 *     look up the current user and push the other user's ID into the current user's 'following' list
 * 
 * check if current user is following another [1 loop over smaller collection, 1 loop over document array field]:
 *   iterate over User documents to find the other user by its ID
 *   iterate over the otherUser.followers list to confirm/deny the existence
 *   of the current user's ID
 * 
 * cleanup (deleting a User document) [0 loops]:
 *  both the follow and following lists are implicitly deleted as they exist on the document
 *  
 * retrieving the user document:
 *   heavy query, every follow and following ID will be queried since they exist on the document
 * 
 * we could go with a more familiar (from a SQL perspective) approach to using an associative collection. here each document
 * represents a connection between two users, either as a follower or followedUser
 * 
 * getting followers [1 loop over larger collection]:
 *   iterate over the Follow collection and find all documents where the current user's id is the 'followedUser'
 *   then populate the follower field of the Follow documents
 * 
 * getting following [1 loop over larger collection]:
 *   iterate over the Follow collection and find all documents where the current user's id is the 'follower'
 *   then populate the followedUser field of the Follow documents
 * 
 * cleanup (deleting a User document) [1 loop over larger collection]:
 *  when a User is deleted we have to iterate over the Follows collection
 *  and destroy all associations that reference the User
 *  we can implement this with a pre-remove hook and a few lines of code
 * 
 * making a connection (following / being followed):
 *  insert a document into the Follow collection with { followedUser: otherUser.id, follower: currentUser.id }
 * 
 * check if current user is following another [1 loop over larger collection]:
 *   iterate over the Follow documents and find a match for { followedUser: otherUser.id, follower: currentUser.id }
 * 
 * retrieving the user document:
 *   there is no additional document size because Follows are handled in a separate collection
 */