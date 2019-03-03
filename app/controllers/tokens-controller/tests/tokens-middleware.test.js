const { mockENV } = require('./mocks');
const { decryptID } = require('../token-utils');
const { failedAuthResponse } = require('../../auth-utils');
const { verifyRefreshToken } = require('../refresh-token-utils');

jest.mock('../token-utils.js', () => ({ decryptID: jest.fn() }));
jest.mock('../../auth-utils.js', () => ({ failedAuthResponse: jest.fn() }));
jest.mock('../refresh-token-utils.js', () => ({ verifyRefreshToken: jest.fn() }));

const {
  verifyPayload,
  authenticateRequest,
  validateRefreshToken,
  decryptAuthedUserID,
} = require('../tokens-middleware');

const resMock = {
  json: jest.fn(),
  status: jest.fn(() => resMock),
};

const nextMock = jest.fn(() => {});

const username = 'the-vampiire';
const password = 'some password';

describe('Token Controller Middleware', () => {
  afterEach(() => jest.clearAllMocks());

  describe('verifyPayload(): verifies the contents of the authentication payload', () => {
    test('valid payload: calls next()', () => {
      const body = { username, password };
      verifyPayload({ body }, resMock, nextMock);
      expect(nextMock).toBeCalled();
    });

    test('no username: responds with 400 status and { error: "username required" }', () => {
      const body = { password };
      verifyPayload({ body }, resMock, nextMock);
      expect(resMock.status).toHaveBeenCalledWith(400);
      expect(resMock.json).toHaveBeenCalledWith({ error: 'username required' });
    });
  
    test('no password: responds with 400 status and { error: "password required" }', () => {
      const body = { username };
      verifyPayload({ body }, resMock, nextMock);
      expect(resMock.status).toHaveBeenCalledWith(400);
      expect(resMock.json).toHaveBeenCalledWith({ error: 'password required' });
    });
  });

  describe('authenticateRequest(): authenticates the User', () => {
    const userMock = { verifyPassword: jest.fn() };
    const models = { User: { findOne: () => userMock } };
    
    const reqMock = { body: {}, context: { models } };
    
    test('successful authentication: adds req.context.authedUser and calls next()', async () => {
      userMock.verifyPassword.mockImplementationOnce(() => true);

      await authenticateRequest(reqMock, resMock, nextMock);
      expect(reqMock.context.authedUser).toBeDefined();
      expect(nextMock).toHaveBeenCalled();
    });

    test('failed authentication: sends failed auth response', async () => {
      userMock.verifyPassword.mockImplementationOnce(() => false);

      await authenticateRequest(reqMock, resMock, nextMock);
      expect(failedAuthResponse).toBeCalled();
    });
  });

  describe('validateRefreshToken(): validates the cookie refresh token', () => {
    const refresh_token = 'tokie';
    const RevokedRefreshToken = { isRevoked: jest.fn() };
    
    const reqMock = {
      signedCookies: { refresh_token },
      context: { models: { RevokedRefreshToken }, env: {} },
    };

    test('validation success: injects req.context.refreshToken and calls next()', async () => {
      verifyRefreshToken.mockImplementationOnce(() => refresh_token);
      RevokedRefreshToken.isRevoked.mockImplementationOnce(() => false);

      await validateRefreshToken(reqMock, resMock, nextMock);
      expect(reqMock.context.refreshToken).toBe(refresh_token);
      expect(nextMock).toBeCalled();
    });

    test('token verficiation fails: sends failed auth response', async () => {
      verifyRefreshToken.mockImplementationOnce(() => null);
      
      await validateRefreshToken(reqMock, resMock, nextMock);
      expect(failedAuthResponse).toBeCalled();
    });

    test('token is revoked: 401 JSON response { error: revoked token }', async () => {
      verifyRefreshToken.mockImplementationOnce(() => true);
      RevokedRefreshToken.isRevoked.mockImplementationOnce(() => true);

      await validateRefreshToken(reqMock, resMock, nextMock);
      expect(resMock.status).toBeCalledWith(401);
      expect(resMock.json).toBeCalledWith({ error: 'revoked token' });
    });
  });

  describe('decryptAuthedUserID(): extracts and decrypts the authed user ID', () => {
    const refreshToken = { sub: 'userID' };
    const reqMock = { context: { refreshToken, env: mockENV } };

    afterEach(() => jest.clearAllMocks());

    test('decryption success: injects req.context.authedUserID and calls next()', () => {
      decryptID.mockImplementationOnce(() => 'decrypted');

      decryptAuthedUserID(reqMock, resMock, nextMock);
      expect(reqMock.context.authedUserID).toBe('decrypted');
      expect(nextMock).toBeCalled();
    });

    test('decryption failure: returns 401 failed auth response', () => {
      decryptID.mockImplementationOnce(() => null);

      decryptAuthedUserID(reqMock, resMock);
      expect(failedAuthResponse).toBeCalled();
    });
  });
});