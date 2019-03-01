const mongoose = require('mongoose');

const revokedRefreshTokenSchema = new mongoose.Schema({
  jwtID: { type: String, unique: true },
  expiresAt: { type: Date, default: null }, 
});

// set dynamic TTL index
// https://docs.mongodb.com/manual/tutorial/expire-data/#expire-documents-at-a-specific-clock-time
revokedRefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// -- STATIC METHODS -- //

/**
 * Revokes a valid refresh JWT
 * - marks for automatic record deletion at JWT expiration + 1 hour buffer
 * @param {JWT} refreshToken
 * @returns {boolean} success (marked as revoked): true
 * @returns {boolean} failure (already revoked): false
 */
async function revoke(refreshToken) {
  const { jti: jwtID, exp: expirationSeconds } = refreshToken;
  // auto-deletes from revoked collection 1 hour (buffer) after natural token expiration
  const expiresAt = expirationSeconds + 1 * 60 * 60;

  try {
    await this.create({ jwtID, expiresAt });
  } catch(error) {
    // duplicate key error code, already revoked
    if (error.code === 11000) return false;
    // unexpected error
    throw { status: 500, message: 'failed to revoke' };
  }

  return true;
}

revokedRefreshTokenSchema.statics.revoke = revoke;

const RevokedRefreshToken = mongoose.model('revoked_refresh_tokens', revokedRefreshTokenSchema);

module.exports = RevokedRefreshToken;
