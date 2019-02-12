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
  requireFollowOwnership,
};
