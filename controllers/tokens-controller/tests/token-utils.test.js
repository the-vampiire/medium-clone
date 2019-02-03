const jwt = require('jsonwebtoken');
const {
  parseTokenOptions,
  createTokenPayload,
  createToken,
  createTokenHandler,
} = require('../token-utils');

const stringOptions = 'algorithm: HS256, expiresIn: 1h, issuer: Medium REST Clone';
const authedUserMock = { id: 'aUserID', username: 'the-vampiire', avatarURL: 'some.url.com' };

describe('Authentication Token utilities', () => {
  test('parseTokenOptions(): parses a String of token options into an options object', () => {
    const expectedShape = { algorithm: 'HS256', expiresIn: '1h', issuer: 'Medium REST Clone' };
    const output = parseTokenOptions(stringOptions);
    expect(output).toEqual(expectedShape);
  });

  test('createTokenPayload(): creates a JWT token payload with a hashed User ID', async () => {
    const saltRoundsMock = 1; // faster for testing
    const output = await createTokenPayload(authedUserMock, saltRoundsMock);
    ['id', 'username', 'avatarURL'].forEach(
      property => expect(output).toHaveProperty(property),
    );
    expect(output.id).not.toBe(authedUserMock.id);
  });

  test('createToken(): creates an authentication JWT', async () => {
    // load JWT_SECRET, JWT_OPTIONS mocks into process environment
    const secret = 'super secret';
    process.env.JWT_SECRET = secret;
    process.env.JWT_OPTIONS = stringOptions;

    const output = await createToken(authedUserMock);
    const token = await jwt.verify(output, secret);

    expect(token.id).toBeDefined();
    expect(token.username).toBe(authedUserMock.username);
    expect(token.avatarURL).toBe(authedUserMock.avatarURL);
    expect(token.iss).toBe('Medium REST Clone');
  });

  test('createTokenHandler(): returns a 200 JSON content response { token }', async () => {
    const reqMock = { authedUser: authedUserMock };
    const resMock = { json: content => content };
    const jsonSpy = jest.spyOn(resMock, 'json');

    const output = await createTokenHandler(reqMock, resMock);
    expect(jsonSpy).toHaveBeenCalled();
    expect(output.token).toBeDefined();

    // clean process environment
    delete process.env.JWT_SECRET;
    delete process.env.JWT_OPTIONS;
  });
});