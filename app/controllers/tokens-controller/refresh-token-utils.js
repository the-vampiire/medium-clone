const { createToken, verifyToken } = require('./token-utils');

/**
 * Creates a refresh JWT for the authed user
 * @param {User} authedUser authenticated user
 * @param {object} env environment variables
 * @param {string} env.REFRESH_TOKEN_SECRET refresh token signing secret
 * @param {string} env.REFRESH_TOKEN_LIFESPAN refresh token expiresIn
 */
const createRefreshToken = (authedUser, env) => {
  const options = {
    expiresIn: env.REFRESH_TOKEN_LIFESPAN,
    signingSecret: env.REFRESH_TOKEN_SECRET,
  };

  return createToken(authedUser, env, options);
};

/**
 * Verifies a refresh token
 * @param {string} refreshToken 
 * @param {string} env.DOMAIN JWT issuer
 * @param {string} env.REFRESH_TOKEN_SECRET refresh token signing secret
 * @returns verification failure: null
 * @returns verification success: decoded refresh token
 */
const verifyRefreshToken = (refreshToken, env) => {
  const { DOMAIN, REFRESH_TOKEN_SECRET } = env;
  return verifyToken(refreshToken, REFRESH_TOKEN_SECRET, DOMAIN);
};

/**
 * Attaches a cookie to the response containing the refresh token
 * - sets flags: signed, secure, httpOnly, sameSite [strict]
 * - only sent on requests to: DOMAIN/tokens/
 * @param {Response} res Response object 
 * @param {string} refreshToken refresh JWT
 * @param {string} env.DOMAIN hosted API domain
 */
const attachRefreshCookie = (res, refreshToken, env) => {
  const cookieOptions = {
    signed: true,
    httpOnly: true,
    sameSite: 'strict',
    path: '/tokens',
    domain: env.DOMAIN,
  };

  res.cookie('refresh_token', refreshToken, cookieOptions);
};

module.exports = {
  createRefreshToken,
  verifyRefreshToken,
  attachRefreshCookie,
};
