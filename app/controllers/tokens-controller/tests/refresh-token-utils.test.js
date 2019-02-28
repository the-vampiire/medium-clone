const { mockENV, authedUserMock } = require('./mocks');
const { createToken, verifyToken } = require('../token-utils');

const {
  createRefreshToken,
  verifyRefreshToken,
  attachRefreshCookie,
} = require('../refresh-token-utils');

jest.mock('../token-utils.js', () => ({
  createToken: jest.fn(),
  verifyToken: jest.fn(),
}));

describe('Access Token utils', () => {
  afterEach(() => jest.clearAllMocks());

  test('createRefreshToken(): creates an refresh JWT using REFRESH_TOKEN_ env vars', () => {
    const expectedOptions = {
      expiresIn: mockENV.REFRESH_TOKEN_LIFESPAN,
      signingSecret: mockENV.REFRESH_TOKEN_SECRET,
    };

    createRefreshToken(authedUserMock, mockENV);
    const calledOptions = createToken.mock.calls[0][2];
    expect(calledOptions).toEqual(expectedOptions);
  });

  test('verifyRefreshToken(): verifies the refresh JWT using REFRESH_TOKEN_ env vars', () => {
    verifyRefreshToken('token', mockENV);
    const [_, secret, domain] = verifyToken.mock.calls[0];
    expect(secret).toBe(mockENV.REFRESH_TOKEN_SECRET);
    expect(domain).toBe(mockENV.DOMAIN);
  });

  describe('attachRefreshCookie(): attaches the refresh token in a response cookie', () => {
    const resMock = { cookie: jest.fn() };
    const token = 'refreshy boi';

    attachRefreshCookie(resMock, token, mockENV);
    const [name, value, calledOptions] = resMock.cookie.mock.calls[0];

    test('sets signed, httpOnly, and sameSite (strict) flags', () => {
      expectedOptions = {
        signed: true,
        httpOnly: true,
        sameSite: 'strict',
      };
      
      Object.keys(expectedOptions).forEach(
        field => expect(calledOptions[field]).toBe(expectedOptions[field]),
      );
    });

    test('sets domain [env.DOMAIN] and path [/tokens] flags', () => {
      expect(calledOptions.path).toBe('/tokens');
      expect(calledOptions.domain).toBe(mockENV.DOMAIN);
    });
  });
});
