/**
 * Handler for discovering an individual User
 * @param {Request} req Request object 
 * @param req.pathUser: The user associated with this request path
 * @param {Response} res Response object
 * @returns JSON response with a User Response Shape 
 */
const userDiscoveryHandler = (req, res) => {
  const { pathUser } = req;
  return res.json(pathUser.toResponseShape());
};

/**
 * Handler for accessing the path User's authored stories
 * @param {Request} req Request object 
 * @param req.pathUser: The user associated with this request path
 * @param req.query.limit: the pagination limit
 * @param req.query.currentPage: the pagination current page
 * @param {Response} res Response object
 * @returns Paginated JSON response { stories, pagination } 
 */
const userStoriesHandler = async (req, res) => {
  const { pathUser, query: { limit, currentPage } } = req;
  const rawStories = await pathUser.getStories({ onlyStories: true, limit, currentPage });
  const stories = await pathUser.shapeAuthoredStories(rawStories);
  const paginatedStories = await pathUser.addStoriesPagination({ stories, limit, currentPage });

  return res.json(paginatedStories);
};

/**
 * Handler for accessing the path User's authored responses
 * @param {Request} req Request object 
 * @param req.pathUser: The user associated with this request path
 * @param req.query.limit: the pagination limit
 * @param req.query.currentPage: the pagination current page
 * @param {Response} res Response object
 * @returns Paginated JSON response { responses, pagination } 
 */
const userResponsesHandler = async (req, res) => {
  const { pathUser, query: { limit, currentPage } } = req;
  const rawResponses = await pathUser.getStories({ onlyResponses: true, limit, currentPage });
  const responses = await pathUser.shapeAuthoredStories(rawResponses);
  const paginatedResponses = await pathUser.addStoriesPagination({ responses, limit, currentPage });

  return res.json(paginatedResponses);
};

module.exports = {
  userDiscoveryHandler,
  userStoriesHandler,
  userResponsesHandler,
};
