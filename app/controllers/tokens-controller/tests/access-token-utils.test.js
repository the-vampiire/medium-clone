const { mockENV, authedUserMock } = require('./mocks');
const { createToken, verifyToken } = require('../token-utils');
const { createAccessToken, verifyAccessToken } = require('../access-token-utils');

jest.mock('../token-utils.js', () => ({
  createToken: jest.fn(),
  verifyToken: jest.fn(),
}));

describe('Access Token utils', () => {
  afterEach(() => jest.clearAllMocks());

  test('createAccessToken(): creates an access JWT using ACCESS_TOKEN_ env vars', () => {
    const expectedOptions = {
      expiresIn: mockENV.ACCESS_TOKEN_LIFESPAN,
      signingSecret: mockENV.ACCESS_TOKEN_SECRET,
    };

    createAccessToken(authedUserMock, mockENV);
    const calledOptions = createToken.mock.calls[0][2];
    expect(calledOptions).toEqual(expectedOptions);
  });

  test('verifyAccessToken(): verifies the access JWT using ACCESS_TOKEN_ env vars', () => {
    verifyAccessToken('token', mockENV);
    const [_, secret, domain] = verifyToken.mock.calls[0];
    expect(secret).toBe(mockENV.ACCESS_TOKEN_SECRET);
    expect(domain).toBe(mockENV.DOMAIN);
  });
});
