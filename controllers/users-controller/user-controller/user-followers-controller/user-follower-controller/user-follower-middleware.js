/**
  * Validates the followerSlug path param
  * - injects req.context.pathFollower
  * - calls next()
  * @param {Request} req Request object
  * @param req.params.followerSlug the follower slug
  * @param req.context.pathUser the user associated with this path
  * @param req.context.models DB models
  * @param {Response} res Response object 
  * @param {Function} next next step function
  * @returns invalid slug: 400 JSON response { error: invalid user slug }
  * @returns follower not found: 404 JSON response { error: follower not found }
  * @returns not following path user: 404 JSON response { error: not following }
  */
const exchangeSlugForFollower = async (req, res, next) => {
  const { followerSlug } = req.params;
  const { pathUser, models } = req.context;

  const username = followerSlug.replace('@', '');
  if (username.length !== followerSlug.length - 1) {
    return res.status(400).json({ error: 'invalid user slug' });
  }

  const follower = await models.User.findOne({ username });
  if (!follower) return res.status(404).json({ error: 'follower not found' });

  const isFollowing = pathUser.followers.some(id => id.toString() === follower.id);
  if (!isFollowing) return res.status(404).json({ error: 'not following' });

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
  const { context: { authedUser }, params: { followerSlug } } = req;

  if (authedUser.slug !== followerSlug) {
    // authed user must be the follower in order to delete their follow
    return res.status(403).json({ error: 'follow ownership required' });
  }

  next();
};

module.exports = {
  exchangeSlugForFollower,
  requireFollowOwnership,
};
