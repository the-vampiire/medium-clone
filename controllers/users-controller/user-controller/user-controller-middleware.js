/**
 * Processes a user slug from the path
 * - injects req.pathUser property on success
 * @requires req.usernameSlug: the slug to exchange
 * @requires req.models DB models
 * @param {Request} req Request object
 * @param {Response} res Response object
 * @param {Function} next next step function
 * @returns {error} 400 JSON response if username slug is invalid
 * @returns {error} 404 JSON response if a corresponding user is not found
 */
const 
const exchangeSlugForUser = async (req, res, next) => {
  const { params: { usernameSlug }, models } = req;

  const username = usernameSlug.replace('@', '');
  if (username.length !== usernameSlug.length - 1) {
    // usernameSlug did not begin with @ or had multiple @ chars: invalid
    return res.status(400).json({ error: 'invalid username' });
  }

  const user = await models.User.findOne({ username });
  if (!user) return res.status(404).json({ error: 'user not found' });
  
  req.pathUser = user;
  next();
};

module.exports = {
  exchangeSlugForUser,
};