const {
  parseTokenOptions,
  createTokenPayload,
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

  test('createToken(): creates and returns a 200 JSON content response { token }', async () => {
    const reqMock = { authedUser: authedUserMock };
    const resMock = { json: content => content };
    const jsonSpy = jest.spyOn(resMock, 'json');

    // load JWT_SECRET, JWT_OPTIONS mocks into process environment
    process.env.JWT_SECRET = 'super secret';
    process.env.JWT_OPTIONS = stringOptions;

    const output = await createTokenHandler(reqMock, resMock);
    expect(jsonSpy).toHaveBeenCalled();
    expect(output).toHaveProperty('token');

    // clean process environment
    delete process.env.JWT_SECRET;
    delete process.env.JWT_OPTIONS;
  });
});