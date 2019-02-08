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

/**
 * Gets a list of the stories the user has clapped for
 * @param {number} pagination.limit pagination limit
 * @param {number} pagination.currentPage pagination current page
 * @returns {[{ count, story }]} a list of { count, story } results
 */
async function getClappedStories(pagination) {
  const { limit = 10, currentPage = 0 } = pagination;

  const { claps } = await this.populate({
      path: 'claps',
      options: {
        limit,
        skip: currentPage * limit,
        sort: { createdAt: -1 },
      },
    }).execPopulate();
  
  return claps.reduce(
    async (resultsPromise, clap) => {
      const results = await resultsPromise; // resolve the returned promise
      const { count, story } = await clap.populate('story').execPopulate();
      return [...results, { count, story }]; // async callback returns a promise
    },
    [],
  );
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
