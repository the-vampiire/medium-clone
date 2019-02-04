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
const nextSpy = jest.fn(() => {});

const notAuthedContent = { error: 'not authenticated' };

const userMock = { id: 'someID' };
const modelsMock = { User: { findById: () => userMock } };

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
    nextSpy.mockClear();
  });

  test('notAuthedResponse(): returns a 401 not authed JSON response', () => {
    notAuthedResponse(resMock);
    expect(statusSpy).toHaveBeenCalledWith(401);
    expect(jsonSpy).toHaveBeenCalledWith(notAuthedContent);
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
      const failModels = { User: { findById: () => null } };
      const output = await getAuthedUser(tokenMock, failModels);
      expect(output).toBeNull();
    });

    test('valid token and User ID: returns authenticated User', async () => {
      const output = await getAuthedUser(tokenMock, modelsMock);
      expect(output).toEqual(userMock);
    });
  });

  describe('requiredAuthedUser(): verifies authentication and injects req.authedUser', () => {
    test('authenticated request: injects req.authedUser and calls next()', async () => {
      const reqMock = { 
        models: modelsMock,
        headers: { authorization: `Bearer ${tokenMock}` },
      };
      
      await requireAuthedUser(reqMock, resMock, nextSpy);
      expect(reqMock.authedUser).toEqual(userMock);
      expect(nextSpy).toHaveBeenCalled();
    });
  
    test('invalid authorization header: returns not authed response', async () => {
      const reqMock = { headers: { authorization: '' } };
      
      const output = await requireAuthedUser(reqMock, resMock);
      expect(output).toEqual(notAuthedContent);
    });

    test('authed user not found: returns not authed response', async () => {
      const reqMock = { 
        models: { User: { findById: () => null } },
        headers: { authorization: `Bearer ${tokenMock}` },
      };
    
      const output = await requireAuthedUser(reqMock, resMock);
      expect(output).toEqual(notAuthedContent);
    });
  });
});