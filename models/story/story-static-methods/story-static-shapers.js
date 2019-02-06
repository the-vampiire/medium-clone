const { injectPagination } = require('../../../controllers/controller-utils');

/**
 * Adds pagination to stories query result
 * @param {object} options
 * @param {object} options.output original output to be paginated
 * @param {number} options.limit pagination limit
 * @param {number} options.currentPage pagination current page
 * @returns {object} { ...output, pagination } using injectPagination() Controllers util 
 */
async function addPagination(options) {
  const basePath = 'stories';
  // only published, only stories (no parent)
  const totalDocuments = await this.countDocuments({ published: true, parent: null });

  return injectPagination({ ...options, basePath, totalDocuments });
};

module.exports = {
  addPagination,
};