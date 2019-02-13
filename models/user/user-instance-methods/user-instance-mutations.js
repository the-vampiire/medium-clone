const { MAX_CLAP_COUNT } = require('../../clap');

/**
 * Creates a follow connection between (this) and another user
 * - adds (this) to userToFollow.followers
 * - adds userToFollow to (this).following
 * @param {User} userToFollow the user to follow
 * @throws self follow: { status: 403, message: can not follow self }
 * @throws already following: { status: 400, message: already following }
 */
async function followUser(userToFollow) {
  if (this.id === userToFollow.id) {
    throw { status: 403, message: 'can not follow self' };
  }
  
  // check if the user is already following
  const isFollowing = this.following.some(id => id.toString() === userToFollow.id);
  if (isFollowing) {
    throw { status: 400, message: 'already following' };
  }

  // follow the userToFollow -> push (this) into userToFollow.followers
  await userToFollow.update({ $push: { followers: this } });
  
  // follow the userToFollow -> push userToFollow into (this).following
  return this.update({ $push: { following: userToFollow } });
}

/**
 * Removes a follow connection between (this) and a userToUnfollow
 * - removes (this) from userToUnfollow.followers
 * - removes userToUnfollow from (this).following
 * @param {User} userToUnfollow the user to unfollow
 * @throws not in (this).following: { status: 400, message: not following }
 */
async function unfollowUser(userToUnfollow) {
  const isFollowing = this.following.some(id => id.toString() === userToUnfollow.id);
  if (!isFollowing) {
    throw { status: 400, message: 'not following' };
  }

  // userToUnfollow is followed by (this): userToUnfollow.followers = [this, ...] -> remove (this)
  await userToUnfollow.update({ $pull: { followers: { _id: this } } });

  // (this) is following userToUnfollow: (this).following = [userToUnfollow, ...] -> remove userToUnfollow
  return this.update({ $pull: { following: { _id: userToUnfollow } } })
}

/**
 * Create a new clap for a story
 * - limits clap count minimum to 1
 * - limits clap count maximum to MAX_CLAP_COUNT
 * - upserts to limit duplication (protected at DB level by composite unique index)
 * @param {string} storyID the ID of the story to clap for
 * @param {number} clapsCount the total claps count to apply
 * @throws story not found: { status: 404, message: story not found }
 * @throws author self clap: { status: 403, message: author clapping for own story }
 * @returns a created / upserted Clap
 */
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

/**
 * Creates a story reply to another story
 * - implicitly sets the reply title to the first sentence of the reply body
 * - implicitly publishes the reply story
 * @param {string} storyID the story to reply to 
 * @param {string} body the body of the reply
 * @param {Date} publishedAt the published date
 * @throws story not found: { status: 404, message: story not found }
 * @returns the newly created reply story
 */
async function respondToStory(storyID, body, publishedAt) {
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
    publishedAt,
  });
}

module.exports = {
  followUser,
  unfollowUser,
  clapForStory,
  respondToStory,
};
