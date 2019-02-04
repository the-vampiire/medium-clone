/**
 * Verifies the authentication payload and calls next() if payload:
 * - includes username
 * - includes password
 * @param {Request} req Request object
 * @param {object} req.body Authentication credentials: { username, password }
 * @param {Response} res Response object
 * @param {Function} next next step function
 * @returns if username or password missing 400 response with { error }
 */
const verifyPayload = (req, res, next) => {
  const { username, password } = req.body;
  if (!username) return res.status(400).json({ error: 'username missing' });
  if (!password) return res.status(400).json({ error: 'password missing' });

  next();
};

/**
 * Authenticates the User
 * - injects authedUser into Request object and calls next() on success
 * @param {Request} req Request object
 * @param {object} req.body Authentication credentials: { username, password }
 * @param {object} req.models Database models
 * @param {Response} res Response object
 * @param {Function} next next step function
 * @returns if user is not found or password mismatch 400 response with { error }
 */
const authenticateRequest = async (req, res, next) => {
  const { body: { username, password }, models } = req;

  const user = await models.User.findOne({ username });
  const authenticated = user && await user.verifyPassword(password);

  if (!authenticated) {
    // do not provide any additional details
    // attack workload has doubled (could be username OR password)
    return res.status(401).json({ error: 'failed to authenticate' });
  }

  // inject the authenticated user into the request object
  req.authedUser = user;
  next();
};

module.exports = {
  verifyPayload,
  authenticateRequest,
};
