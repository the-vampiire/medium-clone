const jwt = require('jsonwebtoken');

const {
  setupEnv,
  teardownEnv,
  secret,
  stringOptions,
  authedUserMock,
} = require('./mocks');

const {
  encryptID,
  decryptID,
  parseTokenOptions,
  createTokenPayload,
  createToken,
  verifyToken,
} = require('../token-utils');

describe('Authentication Token utilities', () => {
  beforeAll(() => setupEnv());
  afterAll(() => teardownEnv());
  
  test('encryptID(): encrypts a User ID string', () => {
    const output = encryptID(authedUserMock.id);
    expect(output).not.toBe(authedUserMock.id);
  });

  test('decryptID(): decrypts an encrypted ID string', () => {
    const encryptedID = encryptID(authedUserMock.id);
    const output = decryptID(encryptedID);
    expect(output).toBe(authedUserMock.id);
  });

  test('parseTokenOptions(): parses an env String of JWT options into a JWT options object', () => {
    const expectedShape = { algorithm: 'HS256', expiresIn: '1h', issuer: 'Medium REST Clone' };
    const output = parseTokenOptions(stringOptions);
    expect(output).toEqual(expectedShape);
  });

  test('createTokenPayload(): creates a JWT token payload with an encrypted User ID', () => {
    const output = createTokenPayload(authedUserMock);
    expect(output.id).toBeDefined();
    expect(decryptID(output.id)).toBe(authedUserMock.id);
  });

  test('createToken(): creates an authentication JWT', async () => {
    const output = await createToken(authedUserMock);
    const token = await jwt.verify(output, secret);

    expect(token.id).toBeDefined();
    expect(token.iss).toBe('Medium REST Clone');
  });

  describe('verifyToken(): verifies a Bearer JWT', () => {
    test('verification fails: returns null', () => {
      const badToken = 'iAmABadTokie';
      expect(verifyToken(badToken)).toBeNull();
    });

    test('verification passes: returns token', () => {
      const token = createToken(authedUserMock);
      const output = verifyToken(token);
      const id = decryptID(output.id);
      expect(id).toBe(authedUserMock.id);
    });
  });
});