const { MAX_CLAP_COUNT } = require('../../clap');

async function followUser(followedUser) {
  if (this.id === followedUser.id) {
    throw { status: 403, message: 'can not follow self' };
  }
  
  // check if the user is already following
  const isFollowing = this.following.some(id => id.toString() === followedUser.id);
  if (isFollowing) {
    throw { status: 400, message: 'already following' };
  }

  // update followed user's followers
  followedUser.followers.push(this);
  await followedUser.save();

  // update this following users
  this.following.push(followedUser);
  return this.save();
}

async function clapForStory(storyID, clapsCount) {
  let count = clapsCount;
  if (clapsCount < 1) count = 1;
  else if (clapsCount > MAX_CLAP_COUNT) count = MAX_CLAP_COUNT;

  const story = await this.model('stories').findById(storyID, '_id author');
  if (!story) {
    throw { status: 404, message: 'story not found' }
  } else if (story.author.equals(this.id)) {
    throw { status: 403, message: 'author clapping for own story' };
  }

  // creates or updats the count of a reader's (user) story clap
  return this.model('claps').findOneAndUpdate(
    { reader: this, story }, // identifier for the update
    { $set: { count } }, // operation to perform on the found/created document
    { upsert: true, new: true }, // upsert means update if exists or insert if not
  );
}

async function respondToStory(storyID, body) {
  const Story = this.model('stories');

  const story = await Story.findById(storyID, '_id');
  if (!story) {
    throw { status: 404, message: 'story not found' };
  };

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
