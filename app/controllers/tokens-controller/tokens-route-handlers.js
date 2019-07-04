const { createAccessToken } = require('./access-token-utils');
const {
  createRefreshToken,
  attachRefreshCookie,
  removeRefreshCookie,
} = require('./refresh-token-utils');

/**
 * Signs a short-lived access JWT
 * - extends the refresh token duration by signing a new one
 *  - attaches the new refresh JWT in the response cookie
 * @param {User} req.context.authedUserID the authenticated User's ID
 * @param {object} req.context.env environment variables
 * @returns JSON response { access_token, expiration, type }
 */
const createAccessTokenHandler = (req, res) => {
  const { authedUserID, env } = req.context;

  const access_token = createAccessToken(authedUserID, env);
  const expiration = Date.now() + Number(env.ACCESS_TOKEN_LIFESPAN);

  const refreshToken = createRefreshToken(authedUserID, env);
  attachRefreshCookie(res, refreshToken, env);
  
  return res.json({
    type: 'Bearer',
    access_token,
    expiration,
  });
};

/**
 * Signs a refresh JWT and attaches it in the response cookie
 * @param {User} req.context.authedUser the authenticated User
 * @param {object} req.context.env environment variables
 * @returns 204 no-content response
 */
const createRefreshTokenHandler = (req, res) => {
  const { authedUser, env } = req.context;
  const refreshToken = createRefreshToken(authedUser.id, env);

  attachRefreshCookie(res, refreshToken, env);
  return res.sendStatus(204);
};

/**
 * Revokes a valid refresh token
 * - adds to revoked refresh tokens collection
 *  - auto destroys 1 hour after natural token expiration
 * - clears refresh token cookie on response
 * @param req.context.refreshToken the refresh JWT to be revoked
 * @param req.context.models.RevokedRefreshToken revoked model
 * @returns success: 204 no-content response
 * @returns already revoked: 409 JSON response { error }
 * @returns failed to revoke: 500 JSON response { error }
 */
const revokeRefreshTokenHandler = async (req, res) => {
  const { env, refreshToken, models: { RevokedRefreshToken } } = req.context;

  let success;
  try {
    success = await RevokedRefreshToken.revoke(refreshToken);
  } catch(error) {
    const { status, message } = error;
    return res.status(status).json({ error: message });
  }

  if (!success) {
    return res.status(409).json({ error: 'already revoked' });
  }

  removeRefreshCookie(res, env);
  res.sendStatus(204);
};

module.exports = {
  createAccessTokenHandler,
  createRefreshTokenHandler,
  revokeRefreshTokenHandler,
};