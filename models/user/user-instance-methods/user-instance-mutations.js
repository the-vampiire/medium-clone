const { MAX_CLAP_COUNT } = require('../../clap');

async function followUser(followedUserID) {
  // user can not follow themselves or the universe will implode from recursive nesting
  if (this.id === followedUserID) return null; // our savior, NullMan
  
  // check if the user is already following
  // following is an array of ObjectId, convert to String before comparing
  const isFollowing = this.following.some(id => String(id) === followedUserID);
  if (isFollowing) return null;

  const followedUser = await this.model('users').findById(followedUserID);
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

async function clapForStory(storyID, totalClaps) {
  // reject negative values
  if (totalClaps < 1) return null;

  // limit the maximum count
  const count = Math.min(totalClaps, MAX_CLAP_COUNT);

  const story = await this.model('stories').findById(storyID);
  // some cases the author is populated - access ID, otherwise author is the ObjectID itself
  const authorID = story.author.id || story.author.toString();
  // reject if a story is not found or author is attempting to smell their own farts
  if (!story || authorID === this.id) return null;

  // creates or updates the count of a reader's (user) story clap
  return this.model('claps').updateOne(
    { user: this, story }, // identifier for the update
    { $set: { count } }, // operation to perform on the found/created document
    { upsert: true }, // upsert means update if exists or insert if not
  );
}

async function respondToStory(storyID, body) {
  const Story = this.model('stories');

  const story = await Story.findOne({ _id: storyID }, '_id');
  if (!story) return null; // does not exist

  return Story.create({
    title: body.split('.')[0], // first sentence of response
    body,
    author: this,
    parent: story,
    published: true,
  });
}

module.exports = {
  followUser,
  clapForStory,
  respondToStory,
};
