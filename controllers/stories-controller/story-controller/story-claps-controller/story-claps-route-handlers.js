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

/**
 * Creates a new clap for the Story
 * @param {Request} req Request object 
 * @param {Story} req.pathStory Story belonging to this path
 * @param {User} req.authedUser authenticated User clapping for the story
 * @param {number} req.body.totalClaps the total claps count for the new clap
 * @param {object} query query params for pagination { limit, currentPage }
 * @param {Response} res Response object
 * @returns success: new resource JSON response
 * @returns clapping for own story: 403 JSON response { error }
 * @returns totalClaps missing: 400 JSON response { error }
 */
const clapForStoryHandler = async (req, res) => {
  const { pathStory, authedUser, body: { totalClaps } } = req;

  if (totalClaps === undefined) {
    return res.status(400).json({ error: 'totalClaps required' });
  }

  const clap = await authedUser.clapForStory(pathStory.id, totalClaps);
  if (!clap) return res.status(403).json({ error: 'clapping for author\'s own story' });
  
  const responseData = await clap.toResponseShape();

  return newResourceResponse(responseData, 'clapURL', res);
};

module.exports = {
  clappedReadersHandler,
  clapForStoryHandler,
};