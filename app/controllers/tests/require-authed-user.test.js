const { decryptID, verifyToken } = require('../../controllers/tokens-controller/token-utils');
const { failedAuthResponse } = require('../controller-utils');

const {
  extractBearerToken,
  getAuthedUser,
  requireAuthedUser,
} = require('../require-authed-user');

jest.mock('../controller-utils.js', () => ({ failedAuthResponse: jest.fn() }));
jest.mock('../../controllers/tokens-controller/token-utils.js', () => ({
  decryptID: jest.fn(),
  verifyToken: jest.fn(),
}));

const resMock = {
  json: content => content,  
  status: jest.fn(() => resMock),
};

const nextMock = jest.fn();

const userMock = { id: 'someID' };
const modelsMock = { User: { findById: () => userMock } };

describe('Required Authed User utilities', () => {
  afterEach(() => jest.clearAllMocks());

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
      verifyToken.mockImplementationOnce(() => null);

      const badToken = 'iWasABadTokie';
      const output = await getAuthedUser(badToken);
      expect(output).toBeNull();
    });

    test('user not found: returns null', async () => {
      verifyToken.mockImplementationOnce(() => true);
      decryptID.mockImplementationOnce(() => 'id');

      const failModels = { User: { findById: () => null } };
      const output = await getAuthedUser('a tokie', failModels);
      expect(output).toBeNull();
    });

    test('valid token and User ID: returns authenticated User', async () => {
      verifyToken.mockImplementationOnce(() => true);
      decryptID.mockImplementationOnce(() => 'id');

      const output = await getAuthedUser('a tokie', modelsMock);
      expect(output).toEqual(userMock);
    });
  });

  describe('requiredAuthedUser(): verifies authentication and injects req.authedUser', () => {
    test('authenticated request: injects req.context.authedUser and calls next()', async () => {
      verifyToken.mockImplementationOnce(() => true);
      decryptID.mockImplementationOnce(() => 'id');
      
      const reqMock = { 
        context: { models: modelsMock },
        headers: { authorization: 'Bearer atokie' },
      };
      
      await requireAuthedUser(reqMock, resMock, nextMock);
      expect(reqMock.context.authedUser).toEqual(userMock);
      expect(nextMock).toHaveBeenCalled();
    });
  
    test('invalid authorization header: returns not authed response', async () => {
      const reqMock = { headers: { authorization: '' }, context: {} };
      
      await requireAuthedUser(reqMock, resMock);
      expect(failedAuthResponse).toBeCalled();
    });

    test('authed user not found: returns not authed response', async () => {
      const reqMock = { 
        context: { models: { User: { findById: () => null } } },
        headers: { authorization: 'Bearer atokie' },
      };
    
      await requireAuthedUser(reqMock, resMock);
      expect(failedAuthResponse).toBeCalled();
    });
  });
});