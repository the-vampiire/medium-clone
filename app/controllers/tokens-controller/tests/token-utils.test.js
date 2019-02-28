const jwt = require('jsonwebtoken');

const {
  encryptID,
  decryptID,
  createTokenPayload,
  createToken,
  verifyToken,
  createAccessToken,
  verifyAccessToken,
  createRefreshToken,
  verifyRefreshToken,
  attachRefreshCookie,
} = require('../token-utils');

const authedUserMock = { id: 'anID' };

const mockENV = {
  DOMAIN: 'api domain',
  ENCRYPTION_SECRET: 'encryption bits',
};

describe('Authentication Token utilities', () => {
  test('encryptID(): encrypts a User ID string', () => {
    const output = encryptID(authedUserMock.id, mockENV.ENCRYPTION_SECRET);
    expect(output).not.toBe(authedUserMock.id);
  });

  test('decryptID(): decrypts an encrypted ID string', () => {
    const encryptedID = encryptID(authedUserMock.id, mockENV.ENCRYPTION_SECRET);
    const output = decryptID(encryptedID, mockENV.ENCRYPTION_SECRET);
    expect(output).toBe(authedUserMock.id);
  });

  test('createTokenPayload(): creates a JWT token payload with an encrypted User ID', () => {
    const output = createTokenPayload(authedUserMock, mockENV.ENCRYPTION_SECRET);
    expect(output.sub).toBeDefined();
    expect(decryptID(output.sub, mockENV.ENCRYPTION_SECRET)).toBe(authedUserMock.id);
  });

  describe('createToken(): creates a signed JWT', () => {
    const options = { signingSecret: 'test', expiresIn: '5m' };
    const token = createToken(authedUserMock, mockENV, options);
    const decoded = jwt.decode(token);

    test('sets the [sub] field to the encrypted authedUser ID', () => {
      const decrypted = decryptID(decoded.sub, mockENV.ENCRYPTION_SECRET);
      expect(decrypted).toBe(authedUserMock.id);
    });

    test('sets the [iss] field to the env DOMAIN', () => {
      expect(decoded.iss).toBe(mockENV.DOMAIN);
    });

    test('generates a uuID for the [jti] field', () => {
      expect(decoded.jti).toBeDefined();
      expect(decoded.jti.length).toBe(36);
    });
  });

  describe('verifyToken(): verifies a JWT given its secret and issuer', () => {
    test('valid secret and issuer: returns the decoded token', () => {
      const options = { signingSecret: 'test', expiresIn: '5m' };
      const token = createToken(authedUserMock, mockENV, options);

      const decoded = verifyToken(token, options.signingSecret, mockENV.DOMAIN);
      expect(decoded).not.toBeNull();
    });

    test('invalid options: returns null', () => {
      const options = { signingSecret: 'test', expiresIn: '5m' };
      const token = createToken(authedUserMock, mockENV, options);

      const decoded = verifyToken(token, 'bad secret', mockENV.DOMAIN);
      expect(decoded).toBeNull();
    });
  });
});