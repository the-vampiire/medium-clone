// const { createAccessToken } = require('../access-token-utils');
// const { createRefreshToken, attachRefreshCookie } = require('../refresh-token-utils');

// jest.mock('../access-token-utils.js', () => ({ createAccessToken: jest.fn() }));
// jest.mock('../refresh-token-utils.js', () => ({
//   createRefreshToken: jest.fn(),
//   attachRefreshCookie: jest.fn(),
// }));

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
    const refreshToken = 'tokie';
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
});