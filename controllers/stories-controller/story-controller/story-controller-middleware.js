const { extractStoryID } = require('./story-controller-utils');

/**
 * Processes a story slug from the path
 * - injects req.pathStory property on success
 * @requires req.storySlug: the slug to exchange
 * @requires req.models DB models
 * @param {Request} req Request object
 * @param {Response} res Response object
 * @param {Function} next next step function
 * @returns {error} 400 JSON response if story slug is invalid
 * @returns {error} 404 JSON response if a corresponding story is not found
 */
const exchangeSlugForStory = async (req, res, next) => {
  const { params: { storySlug }, models } = req;
  
  const storyID = extractStoryID(storySlug);
  if (!storyID) return res.status(400).json({ error: 'invalid story slug' });

  const story = await models.Story.findById(storyID);
  if (!story) return res.status(404).json({ error: 'story not found' });

  req.pathStory = story;
  next();
};
module.exports = {
  exchangeSlugForStory,
};