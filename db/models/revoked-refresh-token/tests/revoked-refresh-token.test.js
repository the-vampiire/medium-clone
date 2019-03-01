const mongoose = require('mongoose');
const RevokedRefreshToken = require('../');
const { testUtils: { dbConnect, teardown } } = require('../../../utils');

describe('Revoked Refresh Token', () => {
  beforeAll(() => dbConnect(mongoose));
  afterAll(() => teardown(mongoose, ['revoked_refresh_tokens']));

  describe('static methods', () => {
    // 1 hour expiration from now;
    const hourInSeconds = 1 * 60 * 60;
    const expireBase = Math.floor((Number(Date.now()) / 1000));

    const exp = expireBase + hourInSeconds;
    const refreshToken = { jti: 'tokieID', exp };

    describe('revoke(): revokes a valid refresh JWT', () => {
      test('returns true: creates a revoked entry with auto-deletion at JWT [exp + 1hr]', async () => {
        const output = await RevokedRefreshToken.revoke(refreshToken);
        expect(output).toBe(true);
        
        const revoked = await RevokedRefreshToken.findOne({ jwtID: refreshToken.jti });
        expect(revoked).not.toBeNull();

        const expiresAt = Number(revoked.expiresAt);
        expect(expiresAt).toBe(exp + hourInSeconds);
      });

      test('returns false: token has already been revoked (duplicate entry)', async () => {
        const output = await RevokedRefreshToken.revoke(refreshToken);
        expect(output).toBe(false);
      });

      test('unexpected revocation error: throws { status: 500, message: failed to revoke }', async () => {
        try {
          await RevokedRefreshToken.revoke('nonsense');
        } catch (error) {
          expect(error).toEqual({ status: 500, message: 'failed to revoke' });
        }
      });
    });
  });
});
