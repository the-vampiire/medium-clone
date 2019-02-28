const { decryptID } = require('./tokens-controller/token-utils');
const { verifyAccessToken } = require('./tokens-controller/access-token-utils');

/**
 * Extracts the Bearer token from the Authorization header
 * @param {object} headers Request headers
 * @returns null if token is not found
 * @returns token
 */
const extractBearerToken = (headers) => {
  const { authorization } = headers;
  if (!authorization) return null;

  const [bearer, token] = authorization.split(' ');
  return (bearer !== 'Bearer' || !token) ? null : token;
};

/**
 * Verifies the access JWT and exchanges it for an Authenticated User
 * @param {string} bearerToken Authorization Bearer access JWT 
 * @param {object} models Database models
 * @param {object} env environment variables
 * @returns success: authenticated User
 * @returns token verification or User auth fail: null
 */
const getAuthedUser = async (bearerToken, models, env) => {
  const token = verifyAccessToken(bearerToken, env);
  if (!token) return null;

  const userID = decryptID(token.sub);
  return models.User.findById(userID);
};

/**
 * Returns a not authed response
 * @param {Response} res Response objecet
 * @returns 401 JSON response { error: 'not authenticated' } 
 */
const failedAuthResponse = res => res.status(401).json({ error: 'not authenticated' });

/**
 * Injects an authedUser property on the Request object and calls next()
 * @param {Request} req Request object
 * @param {Response} res Response object
 * @param {Function} next Next step function
 * @returns on failure: returns 401 JSON response { error } 
 */
const requireAuthedUser = async (req, res, next) => {
  const { headers, context: { models, env } } = req;

  const bearerToken = extractBearerToken(headers);
  if (!bearerToken) return failedAuthResponse(res);

  const authedUser = await getAuthedUser(bearerToken, models, env);
  if (!authedUser) return failedAuthResponse(res);

  req.context.authedUser = authedUser;
  next();
};

module.exports = {
  getAuthedUser,
  requireAuthedUser,
  extractBearerToken,
  failedAuthResponse,
};