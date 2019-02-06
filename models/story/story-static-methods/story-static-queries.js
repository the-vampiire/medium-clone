/**
 * Gets the latest published stories
 * - uses limit, currentPage pagination
 * - sorted by descending order of publish date
 * @param {object} paginationQuery pagination query string params
 * @param {number} paginationQuery.limit [10] pagination limit
 * @param {number} paginationQuery.currentPage [0] pagination current page
 * @returns {object} { stories, pagination } paginated output using Story.addPagination
 */
async function getLatestStories(paginationQuery) {
  const { limit = 10, currentPage = 0 } = paginationQuery;

  // limit to max of 20 results per page
  const limitBy = Math.min(limit, 20);
  const skipBy = limitBy * currentPage;

  const latestStories = await this
    .find({ published: true, parent: null }) // only published stories
    .sort({ publishedAt: -1 }) // publish date descending
    .limit(limitBy)
    .skip(skipBy);

  const stories = await Promise.all(latestStories.map(story => story.toResponseShape()));

  return this.addPagination({ output: { stories }, limit: limitBy, currentPage });
}

module.exports = {
  getLatestStories,
};
