const { createToken } = require('../tokens-controller/token-utils');
const { setupEnv, teardownEnv } = require('../tokens-controller/tests/mocks');
const {
  extractBearerToken,
  notAuthedResponse,
  getAuthedUser,
  requireAuthedUser,
} = require('../require-authed-user');

const resMock = {
  status() { return this; },
  json: content => content,  
};

const statusSpy = jest.spyOn(resMock, 'status');
const jsonSpy = jest.spyOn(resMock, 'json');

const userMock = { id: 'someID' };

describe('Required Authed User utilities', () => {
  let tokenMock;
  beforeAll(() => {
    setupEnv();
    tokenMock = createToken(userMock);
  });
  afterAll(() => teardownEnv());

  afterEach(() => {
    statusSpy.mockClear();
    jsonSpy.mockClear();
  });

  test('notAuthedResponse(): returns a 401 not authed JSON response', () => {
    const expected = { error: 'not authenticated' };
    notAuthedResponse(resMock);
    expect(statusSpy).toHaveBeenCalledWith(401);
    expect(jsonSpy).toHaveBeenCalledWith(expected);
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
      const badToken = 'iWasABadTokie';
      const output = await getAuthedUser(badToken);
      expect(output).toBeNull();
    });

    test('user not found: returns null', async () => {
      const models = { User: { findById: () => null } };
      const output = await getAuthedUser(tokenMock, models);
      expect(output).toBeNull();
    });

    test('valid token and User ID: returns authenticated User', async () => {
      const models = { User: { findById: () => userMock } };
      const output = await getAuthedUser(tokenMock, models);
      expect(output).toEqual(userMock);
    });
  });
});