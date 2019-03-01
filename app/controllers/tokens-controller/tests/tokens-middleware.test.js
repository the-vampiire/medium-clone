const { failedAuthResponse } = require('../../auth-utils');
const {
  verifyPayload,
  authenticateRequest,
  validateRefreshToken,
} = require('../tokens-middleware');

jest.mock('../../auth-utils.js', () => ({ failedAuthResponse: jest.fn() }));

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

    test('failed authentication: responds with 401 status and { error }', async () => {
      userMock.verifyPassword.mockImplementationOnce(() => false);

      await authenticateRequest(reqMock, resMock, nextMock);
      expect(failedAuthResponse).toBeCalled();
    });
  });
});