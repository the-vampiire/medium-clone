/**
 * Reduces the total claps count across all User claps
 * @returns {number} the total clap count for the Story
 */
async function getClapsCount() {
  const reduceClapsCount = claps => claps.reduce((total, clap) => total + clap.count, 0);

  return this.populate('claps').execPopulate().then(() => reduceClapsCount(this.claps));
}

// todo: refactor or remove
// too heavy unless paginated, what is the use case?
async function getClappedReaders() {
  const mapClappedUsers = claps => Promise.all(claps.map(
    clap => clap.populate('user').execPopulate().then(populated => populated.user),
  ));

  return this.populate('claps').execPopulate().then(() => mapClappedUsers(this.claps));
}

/**
 * Gets a paginated list of of the Story replies
 * - uses default { limit: 10, currentPage: 0 } if either are missing
 * @param {number} queryParams.limit pagination limit
 * @param {number} queryParams.currentPage pagination current page
 * @returns a paginated replies list { replies, pagination }
 */
async function getReplies(queryParams) {
  const { limit = 10, currentPage = 0 } = queryParams;

  const populated = await this.populate({
    path: 'replies',
    options: {
      limit,
      skip: currentPage * limit,
      sort: { publishedAt: -1 }, // createdAt descending
      match: { published: true }, // only published
    },
  }).execPopulate();

  const replies = await Promise.all(
    populated.replies.map(reply => reply.toResponseShape()),
  );

  // static method access
  return this.model('Story').addPagination({ output: { replies }, limit, currentPage });
}

module.exports = {
  getClapsCount,
  getClappedReaders,
  getReplies,
};
