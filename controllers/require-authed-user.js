const { decryptID, verifyToken } = require('./tokens-controller/token-utils');

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
  return (!bearer || !token) ? null : token;
};

/**
 * Returns a not authed response
 * @param {Response} res Response objecet
 * @returns 401 JSON response { error: 'not authenticated' } 
 */
const notAuthedResponse = res => res.status(401).json({ error: 'not authenticated' });

/**
 * Verifies the JWT and exchanges it for an Authenticated User
 * @param {string} bearerToken Authorization Bearer JWT 
 * @param {object} models Database models
 * @param {User} models.User User model
 * @requires process.env: JWT_SECRET
 * @returns null if token verification fails or User is not found
 */
const getAuthedUser = async (bearerToken, models) => {
  const token = verifyToken(bearerToken);
  if (!token) return null;

  const userID = decryptID(token.id);
  return models.User.findById(userID);
};

/**
 * Injects an authedUser property on the Request object and calls next()
 * @param {Request} req Request object
 * @param {Response} res Response object
 * @param {Function} next Next step function
 * @returns on failure: returns 401 JSON response { error }
 */
const requireAuthedUser = async (req, res, next) => {
  const { headers, models } = req;

  const bearerToken = extractBearerToken(headers);
  if (!bearerToken) return notAuthedResponse(res);

  const authedUser = await getAuthedUser(bearerToken, models);
  if (!authedUser) return notAuthedResponse(res);

  req.authedUser = authedUser;
  next();
};

module.exports = {
  extractBearerToken,
  notAuthedResponse,
  getAuthedUser,
  requireAuthedUser,
};
