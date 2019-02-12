const { extractStoryID } = require('./story-controller-utils');

/**
 * Processes a story slug from the path
 * - injects req.context.pathStory property on success
 * @requires req.storySlug: the slug to exchange
 * @requires req.context.models DB models
 * @param {Request} req Request object
 * @param {Response} res Response object
 * @param {Function} next next step function
 * @returns {error} 400 JSON response if story slug is invalid
 * @returns {error} 404 JSON response if a corresponding story is not found
 */
const exchangeSlugForStory = async (req, res, next) => {
  const { params: { storySlug }, context: { models } } = req;

  const storyID = extractStoryID(storySlug);
  if (!storyID) return res.status(400).json({ error: 'invalid story slug' });

  const story = await models.Story.findById(storyID);
  if (!story) return res.status(404).json({ error: 'story not found' });

  req.context.pathStory = story;
  next();
};

/**
 * Enforces the authed User is the author of the Story resource
 * - proceeds and calls next() if the authed User is the author
 * @requires req.context.autheduser: the authenticated User
 * @requires req.context.pathStory: the story resource associated with this path
 * @requires req.context.models DB models
 * @param {Request} req Request object
 * @param {Response} res Response object
 * @param {Function} next next step function
 * @returns {error} 401 JSON response if the authed User is not the author
 */
const requireAuthorship = (req, res, next) => {
  const { authedUser, pathStory } = req.context;
  
  // author is an ObjectID type field
  // instance.id uses the default ID getter which converts to string
  // compare strings by calling toString on the author and default getter on authedUser
  if (pathStory.author.toString() !== authedUser.id) {
    return res.status(401).json({ error: 'authorship required' });
  }

  next();
};

module.exports = {
  exchangeSlugForStory,
  requireAuthorship,
};