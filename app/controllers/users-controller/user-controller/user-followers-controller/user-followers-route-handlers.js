const { buildEndpoint } = require('../../../pagination-utils');

/**
 * Handler for fetching a paginated list of the members following the path user
 * @param {Request} req Request object
 * @param req.context.pathUser the user associated with this path
 * @param req.query.limit pagination limit
 * @param req.query.currentPage pagination current page
 * @param {Response} res Response object
 * @returns JSON response { followers, pagination }
 */
const userFollowersHandler = async (req, res) => {
  const { context: { pathUser }, query } = req;

  const responseData = await pathUser.getFollowers(query);
  return res.json(responseData);
};

/**
 * Handler for supporting the authenticated user following the path user
 * @requires authentication
 * @param {Request} req Request object
 * @param req.context.pathUser the user to be followed
 * @param req.context.authedUser the authenticated user
 * @param {Response} res Response object
 * @returns success: 201 response with Location header of the new follower URL
 * @returns following self: 403 JSON response { error: can not follow self }
 * @returns already following: 400 JSON response { error: already following }
 */
const followUserHandler = async (req, res) => {
  const { authedUser, pathUser } = req.context;

  try {
    await authedUser.followUser(pathUser);
  } catch(error) {
    const { status, message } = error;
    return res.status(status).json({ error: message });
  }

  const followerURL = buildEndpoint({
    basePath: `users/${pathUser.slug}`,
    path: `followers/${authedUser.slug}`,
  });

  res.set({ Location: followerURL });
  return res.sendStatus(201);
};

module.exports = {
  followUserHandler,
  userFollowersHandler,
};
