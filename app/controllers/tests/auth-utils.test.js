const { decryptID } = require('../tokens-controller/token-utils');
const { verifyAccessToken } = require('../tokens-controller/access-token-utils');

const {
  getAuthedUser,
  requireAuthedUser,
  extractBearerToken,
  failedAuthResponse,
} = require('../auth-utils');

jest.mock('../../controllers/tokens-controller/token-utils.js', () => ({
  decryptID: jest.fn(),
}));

jest.mock('../../controllers/tokens-controller/access-token-utils.js', () => ({
  verifyAccessToken: jest.fn(),
}));

const resMock = {
  json: jest.fn(),  
  status: jest.fn(() => resMock),
};

const nextMock = jest.fn();

const userMock = { id: 'someID' };
const modelsMock = { User: { findById: () => userMock } };
const envMock = { ENCRYPTION_SECRET: 'secret' };

describe('Required Authed User utilities', () => {
  afterEach(() => jest.clearAllMocks());

  test('failedAuthResponse(): returns a 401 failed to auth JSON response', () => {
    const notAuthedContent = { error: 'failed to authenticate' };
    
    failedAuthResponse(resMock);
    expect(resMock.status).toHaveBeenCalledWith(401);
    expect(resMock.json).toHaveBeenCalledWith(notAuthedContent);
  });

  describe('extractBearerToken(): extracts the Bearer JWT from Authorization header', () => {
    test('given auth header: returns JWT', () => {
      const token = 'iAmATokenISwear';
      const headers = { authorization: `Bearer ${token}` };
      expect(extractBearerToken(headers)).toBe(token);
    });

    test('empty auth header: returns null', () => {
      const headers = { authorization: '' };
      expect(extractBearerToken(headers)).toBeNull();
    });

    test('auth header without "Bearer <Token>" shape: returns null', () => {
      const headers = { authorization: 'Bearer' };
      expect(extractBearerToken(headers)).toBeNull();
    });
  });

  describe('getAuthedUser(): exchanges a Bearer JWT for its corresponding User', () => {
    test('invalid token: returns null', async () => {
      verifyAccessToken.mockImplementationOnce(() => null);

      const badToken = 'iWasABadTokie';
      const output = await getAuthedUser(badToken);
      expect(output).toBeNull();
    });

    test('user not found: returns null', async () => {
      verifyAccessToken.mockImplementationOnce(() => true);
      decryptID.mockImplementationOnce(() => 'id');

      const failModels = { User: { findById: () => null } };
      const output = await getAuthedUser('a tokie', failModels, envMock);
      expect(output).toBeNull();
    });

    test('valid token and User ID: returns authenticated User', async () => {
      verifyAccessToken.mockImplementationOnce(() => true);
      decryptID.mockImplementationOnce(() => 'id');

      const output = await getAuthedUser('a tokie', modelsMock, envMock);
      expect(output).toEqual(userMock);
    });
  });

  describe('requiredAuthedUser(): verifies authentication and injects req.authedUser', () => {
    test('authenticated request: injects req.context.authedUser and calls next()', async () => {
      verifyAccessToken.mockImplementationOnce(() => true);
      decryptID.mockImplementationOnce(() => 'id');
      
      const reqMock = { 
        context: { models: modelsMock, env: envMock },
        headers: { authorization: 'Bearer atokie' },
      };
      
      await requireAuthedUser(reqMock, resMock, nextMock);
      expect(reqMock.context.authedUser).toEqual(userMock);
      expect(nextMock).toHaveBeenCalled();
    });
  
    test('invalid authorization header: returns not authed response', async () => {
      const reqMock = { headers: { authorization: '' }, context: {} };
      
      await requireAuthedUser(reqMock, resMock);
      expect(resMock.status).toBeCalledWith(401);
    });

    test('authed user not found: returns not authed response', async () => {
      const reqMock = { 
        context: { models: { User: { findById: () => null } } },
        headers: { authorization: 'Bearer atokie' },
      };
    
      await requireAuthedUser(reqMock, resMock);
      expect(resMock.status).toBeCalledWith(401);
    });
  });
});