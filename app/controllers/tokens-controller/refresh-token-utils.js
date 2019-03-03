const { createToken, verifyToken } = require('./token-utils');

/**
 * Creates a refresh JWT for the authed user
 * @param {User} authedUserID authenticated user ID
 * @param {object} env environment variables
 * @param {string} env.REFRESH_TOKEN_SECRET refresh token signing secret
 * @param {string} env.REFRESH_TOKEN_LIFESPAN refresh token expiresIn
 */
const createRefreshToken = (authedUserID, env) => {
  const options = {
    expiresIn: env.REFRESH_TOKEN_LIFESPAN,
    signingSecret: env.REFRESH_TOKEN_SECRET,
  };

  return createToken(authedUserID, env, options);
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
 * Creates refresh JWT cookie options
 * - sets flags: signed, secure, httpOnly, sameSite [strict]
 * - sets domain and path: /tokens
 * @param {object} env environment variables
 * @param {string} env.DOMAIN hosted API domain
 * @returns {object} cookie options 
 */
const refreshCookieOptions = env => ({
  signed: true,
  httpOnly: true,
  path: '/tokens',
  domain: env.DOMAIN,
  sameSite: 'strict',
  secure: env.NODE_ENV === 'production',
});

/**
 * Attaches a cookie to the response containing the refresh token
 * - sets flags: signed, secure, httpOnly, sameSite [strict]
 * - only sent on requests to: DOMAIN/tokens/
 * @param {Response} res Response object 
 * @param {string} refreshToken refresh JWT
 * @param {object} env environment variables
 */
const attachRefreshCookie = (res, refreshToken, env) => {
  const cookieOptions = refreshCookieOptions(env);
  res.cookie('refresh_token', refreshToken, cookieOptions);
};

/**
 * Removes the refresh_token cookie from the response
 * @param {Response} res Response object 
 * @param {object} env environment variables
 */
const removeRefreshCookie = (res, env) => {
  const cookieOptions = refreshCookieOptions(env);
  res.clearCookie('refresh_token', cookieOptions);
}

module.exports = {
  createRefreshToken,
  verifyRefreshToken,
  attachRefreshCookie,
  removeRefreshCookie,
  refreshCookieOptions,
};
