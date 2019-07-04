const accessTokenUtils = require('../access-token-utils');
const refreshTokenUtils = require('../refresh-token-utils');

jest.mock('../access-token-utils.js');
jest.mock('../refresh-token-utils.js');

const {
  createAccessTokenHandler,
  createRefreshTokenHandler,
  revokeRefreshTokenHandler,
} = require('../tokens-route-handlers');
const { mockENV, authedUserMock } = require('./mocks');

const resMock = {
  json: jest.fn(),
  sendStatus: jest.fn(),
  status: jest.fn(() => resMock),
}

describe('Tokens Controller handlers', () => {
  describe('createRefreshTokenHandler(): POST /tokens', () => {
    const reqMock = { context: { authedUser: authedUserMock, env: mockENV} };

    beforeAll(() => createRefreshTokenHandler(reqMock, resMock));
    afterAll(() => jest.clearAllMocks());

    test('creates a refresh token and attaches it to the response cookie', () => {
      expect(refreshTokenUtils.attachRefreshCookie).toBeCalled();
    });

    test('sends a 204 no-content response', () => {
      expect(resMock.sendStatus).toBeCalledWith(204);
    });
  });

  describe('revokeRefreshTokenHandler(): DELETE /tokens', () => {
    const RevokedRefreshToken = { revoke: jest.fn() };
    const context = { env: mockENV, refreshToken: 'tokie', models: { RevokedRefreshToken } };
    
    const reqMock = { context };

    afterEach(() => jest.clearAllMocks());

    test('success: removes refresh token cookie and sends a 204 no-content response', async () => {
      RevokedRefreshToken.revoke.mockImplementationOnce(() => true);

      await revokeRefreshTokenHandler(reqMock, resMock);
      expect(refreshTokenUtils.removeRefreshCookie).toBeCalled();
      expect(resMock.sendStatus).toBeCalledWith(204);
    });

    test('already revoked: 409 JSON response { error: already revoked }', async () => {
      RevokedRefreshToken.revoke.mockImplementationOnce(() => false);

      await revokeRefreshTokenHandler(reqMock, resMock);
      expect(resMock.status).toBeCalledWith(409);
      expect(resMock.json).toBeCalledWith({ error: 'already revoked' });
    });

    test('failed to revoke: 500 JSON response { error: failed to revoke }', async () => {
      RevokedRefreshToken.revoke.mockImplementationOnce(() => {
        throw { status: 500, message: 'failed to revoke' };
      });

      await revokeRefreshTokenHandler(reqMock, resMock);
      expect(resMock.status).toBeCalledWith(500);
      expect(resMock.json).toBeCalledWith({ error: 'failed to revoke' });
    });
  });

  describe('createAccessTokenHandler(): GET /tokens/access_token', () => {
    const accessToken = 'tokie';
    const reqMock = { context: { authedUser: authedUserMock, env: mockENV } };

    const globalDateNow = global.Date.now;
    global.Date.now = jest.fn(() => 0); // expiration = 0 + ACCESS_TOKEN_LIFESPAN

    beforeAll(() => {
      accessTokenUtils.createAccessToken.mockImplementationOnce(() => accessToken);
      createAccessTokenHandler(reqMock, resMock);
    });
    // reset global Date
    afterAll(() => { global.Date.now = globalDateNow; });

    test('extends the refresh token and attaches it to the response cookie', () => {
      expect(refreshTokenUtils.createRefreshToken).toBeCalled();
      expect(refreshTokenUtils.createRefreshToken).toBeCalled();
    });

    test('returns a JSON response: { type: Bearer, access_token, expiration }', () => {
      expect(resMock.json).toBeCalledWith({
        type: 'Bearer',
        access_token: accessToken,
        expiration: Number(mockENV.ACCESS_TOKEN_LIFESPAN),
      });
    });
  });
});