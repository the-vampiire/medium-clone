/**
 * Verifies and exchanges the :followerSlug for a pathFollower
 * - injects req.context.pathFollower
 * - calls next()
 * @param {Request} req Request object
 * @param req.params.followerSlug the follower slug
 * @param req.context.models DB models
 * @param {Response} res Response object 
 * @param {Function} next next step function
 * @returns invalid slug: 400 JSON response { error: invalid user slug }
 * @returns follower not found: 404 JSON response { error: follower not found }
*/
const exchangeSlugForFollower = async (req, res, next) => {
  const { context: { models }, params: { followerSlug } } = req;

  const username = followerSlug.replace('@', '');
  if (username.length !== followerSlug.length - 1) {
    return res.status(400).json({ error: 'invalid user slug' });
  }

  const follower = await models.User.findOne({ username }, '_id');
  if (!follower) return res.status(404).json({ error: 'follower not found' });

  req.context.pathFollower = follower;
  next();
};

/**
 * Verifies that the follower matches the authenticated user and calls next()
 * @param {Request} req Request object
 * @param req.params.followerSlug the follower to be removed from the path user's followers
 * @param req.context.authedUser the authenticated user
 * @param {Response} res Response object 
 * @param {Function} next next step function
 * @returns authed user is not the follower: 403 JSON response { error: follow ownership required }
*/
const requireFollowOwnership = (req, res, next) => {
  const { authedUser, pathFollower } = req.context;

  if (authedUser.id !== pathFollower.id) {
    // authed user must be the follower in order to delete their follow
    return res.status(403).json({ error: 'follow ownership required' });
  }

  next();
};

module.exports = {
  requireFollowOwnership,
  exchangeSlugForFollower,
};
