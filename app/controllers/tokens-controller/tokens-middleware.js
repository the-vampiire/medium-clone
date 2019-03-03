const { decryptID } = require('./token-utils');
const { failedAuthResponse } = require('../auth-utils');
const { verifyRefreshToken } = require('./refresh-token-utils');

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
  if (!username) return res.status(400).json({ error: 'username required' });
  if (!password) return res.status(400).json({ error: 'password required' });

  next();
};

/**
 * Authenticates the User
 * - injects req.context.authedUser and calls next() on success
 * @param {Request} req Request object
 * @param {object} req.body Authentication credentials: { username, password }
 * @param {object} req.models Database models
 * @param {Response} res Response object
 * @param {Function} next next step function
 * @returns failure: 401 JSON response { error }
 */
const authenticateRequest = async (req, res, next) => {
  const { body: { username, password }, context: { models } } = req;

  const user = await models.User.findOne({ username });
  const authenticated = user && await user.verifyPassword(password);

  if (!authenticated) {
    // do not provide any additional details
    // attack workload has doubled (could be username OR password)
    return failedAuthResponse(res);
  }

  // inject the authenticated user into the request object
  req.context.authedUser = user;
  next();
};

/**
 * Validates the refresh JWT and ensures it has not been revoked
 * - success: injects req.context.refreshToken and calls next()
 * @param req.signedCookies.refresh_token refresh JWT
 * @param req.context.env environment variables
 * @param req.context.models.RevokedRefreshToken revoked model
 * @returns token verficiation fails: 401 JSON response { error }
 * @returns token is revoked: 401 JSON response { error }
 */
const validateRefreshToken = async (req, res, next) => {
  const { refresh_token } = req.signedCookies;
  const { env, models: { RevokedRefreshToken } } = req.context;

  const token = verifyRefreshToken(refresh_token, env);
  if (!token) return failedAuthResponse(res);

  const isRevoked = await RevokedRefreshToken.isRevoked(token);
  if (isRevoked) return res.status(401).json({ error: 'revoked token' });

  req.context.refreshToken = token;
  next();
};

/**
 * Extracts and decrypts the authed user ID from the refresh token
 * - success: injects req.context.authedUserID and calls next()
 * @param req.context.refreshToken refresh JWT, { sub: <encryptedID> }
 * @param req.context.env.ENCRYPTION_SECRET secret for decoding the ID
 * @returns failure: 401 JSON failed auth response  
 */
const decryptAuthedUserID = (req, res, next) => {
  const { refreshToken, env: { ENCRYPTION_SECRET } } = req.context;
  const encryptedID = refreshToken.sub;
  const decryptedID = decryptID(encryptedID, ENCRYPTION_SECRET);

  if (!decryptedID) return failedAuthResponse(res);

  req.context.authedUserID = decryptedID;
  next();
};

module.exports = {
  verifyPayload,
  decryptAuthedUserID,
  authenticateRequest,
  validateRefreshToken,
};
