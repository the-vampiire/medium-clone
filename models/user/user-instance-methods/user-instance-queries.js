const bcrypt = require('bcrypt');

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
async function getStories({
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
function getClappedStories(limit, currentPage) {
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
};

/**
 * Compares a plaintext password attempt against the hashed password
 * @param {string} passwordAttempt password to compare
 * @returns resolves true or false
 */
async function verifyPassword(passwordAttempt) {
  if (!passwordAttempt) return false;
  return bcrypt.compare(passwordAttempt, this.password);
}

module.exports = {
  getStories,
  getClappedStories,
  verifyPassword,
};
