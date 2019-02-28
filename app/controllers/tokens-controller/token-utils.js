const jwt = require('jsonwebtoken');
const cryptoJS = require('crypto-js');

/**
 * WTF uuID generator...
 * wizardry -> https://gist.github.com/jed/982883
 * @param {string} a I don't know and at this point I'm too afraid to ask
 */
const wtfID = () => {
  const b = a=>a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,b);
  return b();
}

/**
 * AES encryption of a User ID
 * @param {string} id User ID to encrypt
 * @param {string} encryptionSecret: encryption secret
 * @returns {string} encrypted ID 
 */
const encryptID = (id, encryptionSecret) => {
  const cipher = cryptoJS.AES.encrypt(id, encryptionSecret);
  return cipher.toString();
};

/**
 * AES decryption of an encrypted User ID
 * @param {string} encryptedID Encrypted ID to decrypt
 * @param {string} encryptionSecret: encryption secret
 * @returns {string} decrypted ID 
 */
const decryptID = (encryptedID, encryptionSecret) => {
  const bytes = cryptoJS.AES.decrypt(encryptedID, encryptionSecret);
  return bytes.toString(cryptoJS.enc.Utf8);
}

/**
 * Creates a JWT { sub } payload
 * @param {User} authedUser Authenticated User from request
 * @param {string} encryptionSecret encryption secret
 * @returns {object} { sub: <encrypted ID> }
 */
const createTokenPayload = (authedUser, encryptionSecret) => {
  const encryptedID = encryptID(authedUser.id, encryptionSecret);
  return { sub: encryptedID };
}; 

/**
 * Creates a signed JWT using HS256 signing algorithm
 * - generates a unique (uuID) jwtID/jti token field
 * @param {User} authedUser the authenticated User
 * @param {string} env.DOMAIN for the issuer field of the JWT
 * @param {string} env.ENCRYPTION_SECRET for encrypting the { sub } JWT payload 
 * @param {string} options.expiresIn JWT lifespan
 * @param {string} options.signingSecret JWT signing secret
 * @returns signed JWT
 */
const createToken = (authedUser, env, options) => {
  const { DOMAIN, ENCRYPTION_SECRET } = env;
  const { signingSecret, expiresIn } = options;

  const payload = createTokenPayload(authedUser, ENCRYPTION_SECRET);

  const tokenOptions = {
    expiresIn,
    issuer: DOMAIN,
    jwtid: wtfID(),
    algorithm: 'HS256',
  };

  return jwt.sign(payload, signingSecret, tokenOptions);
}

/**
 * Verifies the JWT
 * @param {string} token JWT to verify
 * @param {string} tokenSecret secret for the JWT
 * @param {string} issuer JWT issuer (API domain)
 * @returns verification failure: null
 * @returns verification success: decoded token
 */
const verifyToken = (token, tokenSecret, issuer) => {
  const verifyOptions = { issuer, algorithms: ['HS256'] };

  try {
    return jwt.verify(token, tokenSecret, verifyOptions);
  } catch(error) {
    return null;
  }
};

module.exports = {
  encryptID,
  decryptID,
  createTokenPayload,
  createToken,
  verifyToken,
};
