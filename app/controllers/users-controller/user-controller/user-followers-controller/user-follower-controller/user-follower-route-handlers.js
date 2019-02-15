/**
 * Handler for confirming the followerSlug user is a follower of the path user
 * - lightweight confirmation response
 * - suggested use: controlling accessibility of a "follow" action on the client
 * - the follower's user details should be accessed via their slug at GET /users/:usernameSlug
 * @param {Request} req Request object
 * @param req.context.pathFollower the follower associated with this path
 * @param req.context.pathUser the user associated with this path
 * @param {Response} res Response object 
 * @param {Function} next next step function
 * @returns 204 no content response as confirmation of followship
 * @returns not following path user: 404 JSON response { error: not following }
*/
const isFollowingHandler = async (req, res) => {
  const { pathUser, pathFollower } = req.context;

  const isFollowing = pathUser.followers.some(id => id.toString() === pathFollower.id);
  if (!isFollowing) return res.status(404).json({ error: 'not following' });

  return res.sendStatus(204); // lightweight confirmation response
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
 * DELETE /users/the-vampiire/followers/the-werewolf
 * - authed user (the-werewolf) unfollows the-vampiire
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
