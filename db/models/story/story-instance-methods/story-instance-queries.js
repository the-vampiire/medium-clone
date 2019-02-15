/**
 * Reduces the total claps count across all User claps
 * @returns {number} the total clap count for the Story
 */
// TODO: refactor to use model aggregate
async function getClapsCount() {
  const reduceClapsCount = claps => claps.reduce((total, clap) => total + clap.count, 0);

  return this.populate('claps').execPopulate().then(() => reduceClapsCount(this.claps));
}

/**
 * Gets a paginated list of readers who clapped for the Story
 * @param {number} query.limit [10] pagination limit
 * @param {number} query.currentPage [0] pagination current page 
 * @returns paginated readers output { readers, pagination }
 */
async function getClappedReaders(query) {
  const { limit = 10, currentPage = 0 } = query;

  const populated = await this
    .populate({
      path: 'claps',
      options: { limit, skip: currentPage * limit, sort: { count: -1 } },
    }).execPopulate()

  const readers = await Promise.all(
    populated.claps.map(async (clap) => {
      const { reader } = await clap.populate('reader').execPopulate();
      return reader.toResponseShape();
    }),
  );

  return this.model('stories').addPagination({ output: { readers }, limit, currentPage });
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
  return this.model('stories').addPagination({ output: { replies }, limit, currentPage });
}

module.exports = {
  getClapsCount,
  getClappedReaders,
  getReplies,
};
 