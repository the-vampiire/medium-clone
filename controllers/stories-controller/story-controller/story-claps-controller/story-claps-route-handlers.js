const { newResourceResponse } = require('../../../controller-utils');

/**
 * Retrieves a paginable list of readers who clapped for the Story
 * @param {Request} req Request object 
 * @param {Story} req.pathStory story belonging to this path
 * @param {object} query query params for pagination { limit, currentPage }
 * @param {Response} res Response object
 * @returns JSON response { totalClaps, readers, pagination }
 */
const clappedReadersHandler = async (req, res) => {
  const { pathStory, query } = req;
  
  const totalClaps = await pathStory.getClapsCount();
  const { readers, pagination } = await pathStory.getClappedReaders(query);

  return res.json({ totalClaps, readers, pagination });
};

module.exports = {
  clappedReadersHandler,
};