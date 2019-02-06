/**
 * Creates and shapes the response of a new Story
 * @requires req.authedUser: an authenticated User as the author
 * @requires req.models: Database models
 * @param {Request} req Request object
 * @param {Response} res Response object
 * @returns {error} 400 JSON response if the title is missing { error }
 * @returns {Story} JSON response with the newly created Story in Story Response shape
 */
const newStoryHandler = async (req, res) => {
  const { body: { title, body }, authedUser, models } = req;

  if (!title) return res.status(400).json({ error: 'title missing' });
  
  const newStory = await models.Story.create({ title, body, author: authedUser });
  const responseShape = await newStory.toResponseShape();

  return res.json(responseShape);
};

/**
 * Retrieves a paginable list of recently published stories
 * @requires req.models: Database models
 * @param {Request} req Request object
 * @param {number} req.query.limit pagination limit
 * @param {number} req.query.currentPage pagination current page
 * @param {Response} res Response object
 * @returns {object} JSON response with { stories, pagination } shape
 */
const latestStoriesHandler = async (req, res) => {
  const { query, models } = req;
  return res.json(models.Story.getLatestStories(query));
};

module.exports = {
  newStoryHandler,
  latestStoriesHandler,
};
