const { createAccessToken } = require('./access-token-utils');
const { createRefreshToken, attachRefreshCookie } = require('./refresh-token-utils');

/**
 * Responds with an authentication JWT
 * @param {Response} res the Response object
 * @param {Request} req the Request object
 * @param {User} req.context.authedUser the authenticated User
 * @returns a 200 JSON response with the JWT as content: { token } 
 */
const createRefreshTokenHandler = (req, res) => {
  const { authedUser, env } = req.context;

  const refreshToken = createRefreshToken(authedUser, env);

  attachRefreshCookie(res, refreshToken, env);
  return res.sendStatus(204);
};

const revokeRefreshTokenHandler = (req, res) => {
  // add to blacklist
  // clear cookie
};

const createAccessTokenHandler = (req, res) => {
  // send back complete access token response in JSON
};

module.exports = {
  createAccessTokenHandler,
  createRefreshTokenHandler,
  revokeRefreshTokenHandler,
};