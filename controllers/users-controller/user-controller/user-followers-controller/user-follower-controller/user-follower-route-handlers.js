/**
 * Handler for confirming the followerSlug user is a follower of the path user
 * - suggested use: controlling accessibility of a "follow" action on the client
 * - the follower's user details can be accessed via GET /users/:usernameSlug
 * @param {Request} req Request object
 * @param req.params.followerSlug the follower slug
 * @param req.context.pathUser the user associated with this path
 * @param req.context.models DB models
 * @param {Response} res Response object 
 * @param {Function} next next step function
 * @returns 204 no content response as confirmation of followship
 * @returns invalid slug: 400 JSON response { error: invalid user slug }
 * @returns follower not found: 404 JSON response { error: follower not found }
 * @returns not following path user: 404 JSON response { error: not following }
*/
const isFollowingHandler = async (req, res) => {
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

  return res.sendStatus(204);
}; 

/**
 * Handler for supporting the authenticated user unfollowing the path user
 * @requires authentication and follow ownership
 * @param {Request} req Request object
 * @param req.context.pathUser the user to be unfollowed
 * @param req.context.authedUser the authenticated user
 * @param {Response} res Response object
 * @returns success: 204 no content
 * @returns follower not found: 400 JSON response { error: follower not found }
 * @returns not already following: 400 JSON response { error: not following }
 * @example
 * DELETE /users/vamp/followers/wolf
 * - authed user (wolf) unfollows vamp
 */
const unfollowUserHandler = async (req, res) => {
  const { authedUser, pathUser } = req.context;

  try {
    await authedUser.unfollowUser(pathUser);
  } catch(error) {
    const { status, message } = error;
    return res.status(status).json({ error: message });
  }

  return res.sendStatus(204);
};

module.exports = {
  isFollowingHandler,
  unfollowUserHandler,
};
