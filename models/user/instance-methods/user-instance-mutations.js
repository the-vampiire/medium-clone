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
  const count = totalClaps <= MAX_CLAP_COUNT ? totalClaps : MAX_CLAP_COUNT;

  const story = await this.model('stories').findById(storyID);
  // reject if a story is not found
  if (!story) return null;
  // reject authors clapping for their own story
  else if (String(story.author) === this.id) return null;

  // creates or updates the count of a reader's (user) story clap
  return this.model('claps').updateMany(
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