const { mockENV, authedUserMock } = require('./mocks');
const { createToken, verifyToken } = require('../token-utils');

jest.mock('../token-utils.js', () => ({
  createToken: jest.fn(),
  verifyToken: jest.fn(),
}));

const {
  createRefreshToken,
  verifyRefreshToken,
  attachRefreshCookie,
  removeRefreshCookie,
  refreshCookieOptions,
} = require('../refresh-token-utils');

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

  describe('refreshCookieOptions(): configures cookie options ', () => {
    const output = refreshCookieOptions(mockENV);

    test('sets signed, httpOnly, sameSite (strict), secure, domain, and path [/tokens] flags', () => {
      expectedOptions = {
        signed: true,
        httpOnly: true,
        path: '/tokens',
        domain: mockENV.DOMAIN,
        sameSite: 'strict',
        secure: mockENV.NODE_ENV === 'production',
      };
      
      Object.keys(expectedOptions).forEach(
        field => expect(output[field]).toBe(expectedOptions[field]),
      );
    });

    test('NODE_ENV = test || development: sets secure flag false', () => {
      const env = { ...mockENV, NODE_ENV: 'test' };
      const output = refreshCookieOptions(env);
      expect(output.secure).toBe(false);
    });

    test('NODE_ENV = production: sets secure flag true', () => {
      const env = { ...mockENV, NODE_ENV: 'production' };
      const output = refreshCookieOptions(env);
      expect(output.secure).toBe(true);
    }); 
  });

  test('attachRefreshCookie(): attaches the refresh token in a response cookie', () => {
    const resMock = { cookie: jest.fn() };
    const token = 'refreshy boi';

    attachRefreshCookie(resMock, token, mockENV);
    expect(resMock.cookie).toBeCalledWith('refresh_token', token, refreshCookieOptions(mockENV));
  });

  test('removeRefreshCookie(): removes refresh token cookie from response', () => {
    const resMock = { clearCookie: jest.fn() };

    removeRefreshCookie(resMock, mockENV);
    expect(resMock.clearCookie).toBeCalledWith('refresh_token', refreshCookieOptions(mockENV));
  });
});
