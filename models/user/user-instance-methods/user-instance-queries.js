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
 * Gets a paginated list of the stories the user has clapped for
 * - converts stories to Story Response Shape
 * - converts claps to Clap Response Shape
 * - injects pagination into the result object
 * @param {number} paginationQuery.limit pagination limit
 * @param {number} paginationQuery.currentPage pagination current page
 * @returns paginated result { pagination, clapped_stories: [{ clap, story }] }
 */
async function getClappedStories(paginationQuery) {
  const { limit = 10, currentPage = 0 } = paginationQuery;

  const { claps } = await this.populate({
      path: 'claps',
      options: { limit, skip: (currentPage * limit), sort: { createdAt: -1 } },
    }).execPopulate();
  
  const clappedStories = await claps.reduce(
    async (resultsPromise, initialClap) => {
      const results = await resultsPromise; // resolve the returned promise
      const populatedClap = await initialClap.populate('story').execPopulate();
      
      const story = await populatedClap.story.toResponseShape();
      const clap = await populatedClap.toResponseShape();
      
      return [...results, { story, clap }]; // async callback returns a promise
    },
    [],
  );

  const totalDocuments = await this.model('claps').countDocuments({ reader: this }).exec();

  return this.addPagination({
    limit,
    currentPage,
    path: 'claps',
    totalDocuments,
    output: { clapped_stories: clappedStories },
  });
};

/**
 * Get a paginated list of the members the user is following
 * - retrives result in descending order of the order they were pushed (follow date)
 * - converts followed users into User Response Shape
 * - injects pagination into the results
 * @param {number} paginationQuery.limit pagination limit
 * @param {number} paginationQuery.currentPage pagination current page
 * @returns paginated result { followed_users, pagination }
 */
async function getFollowedUsers(paginationQuery) {
  const { limit = 10, currentPage = 0 } = paginationQuery;
  
  // retrieve before populate, populate will mutate this document
  const totalDocuments = this.following.length;

  const populated = await this.populate({
    path: 'following',
    options: { limit, skip: (limit * currentPage) }
  }).execPopulate();

  const followed_users = populated.following.map(user => user.toResponseShape());

  return this.addPagination({
    limit,
    currentPage,
    totalDocuments,
    path: 'following',
    output: { followed_users },
  });
}

/**
 * Get a paginated list of the user's followers
 * - retrives result in descending order of the order they were pushed (follow date)
 * - converts followers into User Response Shape
 * - injects pagination into the results
 * @param {number} paginationQuery.limit pagination limit
 * @param {number} paginationQuery.currentPage pagination current page
 * @returns paginated result { followers, pagination }
 */
async function getFollowers(paginationQuery) {
  const { limit = 10, currentPage = 0 } = paginationQuery;
  
  // retrieve before populate, populate will mutate this document
  const totalDocuments = this.followers.length;

  const populated = await this.populate({
    path: 'followers',
    options: { limit, skip: (limit * currentPage) }
  }).execPopulate();

  const followers = populated.followers.map(user => user.toResponseShape());

  return this.addPagination({
    limit,
    currentPage,
    totalDocuments,
    path: 'followers',
    output: { followers },
  });
}

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
  getFollowers,
  verifyPassword,
  getFollowedUsers,
  getClappedStories,
};
