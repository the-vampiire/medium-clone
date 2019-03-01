const mongoose = require('mongoose');
const RevokedRefreshToken = require('../');
const { testUtils: { dbConnect, teardown } } = require('../../../utils');


describe('Revoked Refresh Token', () => {
  beforeAll(() => dbConnect(mongoose));
  afterAll(() => teardown(mongoose, ['revoked_refresh_tokens']));

  /* WARNING: remove skip if any changes made to TTL index in model file */
  describe.skip('document TTL index', () => {
    const expireBase = Math.floor((Number(Date.now())));
    // expire immediately
    const testData = { jwtID: 'tokie id', expiresAt: expireBase };

    test('destroys the document at the [expiresAt] time', async () => {
      const newDoc = await RevokedRefreshToken.create(testData);
      expect(newDoc).not.toBeNull();

      setTimeout(async () => {
        const foundDoc = await RevokedRefreshToken.findById(newDoc.id);
        expect(foundDoc).toBeNull();
      }, 100); // 100ms buffer for checking in case of test env delays
    });
  });

  describe('static methods', () => {
    // 1 hour expiration from now
    const exp = Number(Date.now()) + 1 * 60 * 60 * 1000;
    const refreshToken = { jti: 'tokieID', exp };

    describe('revoke(): revokes a valid refresh JWT', () => {
      // cleanup after test
      afterAll(() => RevokedRefreshToken.deleteOne({ jwtID: refreshToken.jti }));

      test('returns true: creates a revoked entry with auto-deletion at JWT [exp + 1hr]', async () => {
        const output = await RevokedRefreshToken.revoke(refreshToken);
        expect(output).toBe(true);
        
        const revoked = await RevokedRefreshToken.findOne({ jwtID: refreshToken.jti });
        expect(revoked).not.toBeNull();

        const expiresAt = Number(revoked.expiresAt);
        expect(expiresAt - exp).toBe(1 * 60 * 60 * 1000)
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

    describe('isRevoked(): checks if a refresh token is revoked', () => {
      beforeAll(() => RevokedRefreshToken.revoke(refreshToken));
      afterAll(() => RevokedRefreshToken.deleteOne({ jwtID: refreshToken.jti }));

      test('returns true: token is revoked', async () => {
        const output = await RevokedRefreshToken.isRevoked(refreshToken);
        expect(output).toBe(true);
      });

      test('returns false: token is not revoked', async () => {
        const validRefresh = { ...refreshToken, jti: 'valid tokie' };
        const output = await RevokedRefreshToken.isRevoked(validRefresh);
        expect(output).toBe(false);
      });
    });
  });
});
