/**
 * Verifies the authentication payload and proceeds to next step in MW chain if valid
 * - includes username
 * - includes password
 * @param {Request} req Request object
 * @param {Response} res Response object
 * @param {Function} next next process function
 * @returns if username or password missing 400 response with { error }
 */
const verifyPayload = (req, res, next) => {
  const { username, password } = req.body;
  if (!username) return res.status(400).json({ error: 'username missing' });
  if (!password) return res.status(400).json({ error: 'password missing' });

  next();
};

const authenticateRequest = async (req, res, next) => {
  const { body: { username, password }, models } = req;

  const user = await models.User.findOne({ username });
  if (!user || !user.verifyPassword(password)) {
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
