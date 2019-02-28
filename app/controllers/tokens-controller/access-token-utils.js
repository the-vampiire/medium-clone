const { createToken, verifyToken } = require('./token-utils');

/**
 * Creates an access JWT for the authed user
 * @param {User} authedUser authenticated user 
 * @param {object} env environment variables
 * @param {string} env.ACCESS_TOKEN_SECRET access token signing secret 
 * @param {string} env.ACCESS_TOKEN_LIFESPAN refresh token expiresIn
 */
const createAccessToken = (authedUser, env) => {
  const options = {
    expiresIn: env.ACCESS_TOKEN_LIFESPAN,
    signingSecret: env.ACCESS_TOKEN_SECRET,
  };

  return createToken(authedUser, env, options);
};

/**
 * Verifies an access token
 * @param {string} accessToken 
 * @param {string} env.DOMAIN JWT issuer
 * @param {string} env.ACCESS_TOKEN_SECRET access token signing secret
 * @returns verification failure: null
 * @returns verification success: decoded access token
 */
const verifyAccessToken = (accessToken, env) => {
  const { DOMAIN, ACCESS_TOKEN_SECRET } = env;
  return verifyToken(accessToken, ACCESS_TOKEN_SECRET, DOMAIN);
};

module.exports = {
  createAccessToken,
  verifyAccessToken,
};
