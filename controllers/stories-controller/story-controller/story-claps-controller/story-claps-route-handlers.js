const { newResourceResponse } = require('../../../controller-utils');

/**
 * Retrieves a paginable list of readers who clapped for the Story
 * @param {Request} req Request object 
 * @param {Story} req.pathStory story belonging to this path
 * @param {object} query query params for pagination { limit, currentPage }
 * @param {Response} res Response object
 * @returns JSON response { clapsCount, readers, pagination }
 */
const clappedReadersHandler = async (req, res) => {
  const { pathStory, query } = req;
  
  const clapsCount = await pathStory.getClapsCount();
  const { readers, pagination } = await pathStory.getClappedReaders(query);

  return res.json({ clapsCount, readers, pagination });
};

/**
 * Creates a new clap for the Story
 * @param {Request} req Request object 
 * @param {Story} req.pathStory Story belonging to this path
 * @param {User} req.authedUser authenticated User clapping for the story
 * @param {number} req.body.count the total claps count for the new clap
 * @param {object} query query params for pagination { limit, currentPage }
 * @param {Response} res Response object
 * @returns success: new resource JSON response
 * @returns clapping for own story: 403 JSON response { error }
 * @returns count missing: 400 JSON response { error }
 */
const clapForStoryHandler = async (req, res) => {
  const { pathStory, authedUser, body: { count } } = req;

  if (count === undefined) {
    return res.status(400).json({ error: 'claps count required' });
  }

  let clap;
  try {
    clap = await authedUser.clapForStory(pathStory.id, count);
  } catch (error) {
    const { status, message } = error;
    return res.status(status).json({ error: message });
  };
  
  const responseData = await clap.toResponseShape();

  return newResourceResponse(responseData, 'clapURL', res);
};

module.exports = {
  clappedReadersHandler,
  clapForStoryHandler,
};