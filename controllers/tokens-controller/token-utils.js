const jwt = require('jsonwebtoken');
const cryptoJS = require('crypto-js');

/**
 * AES encryption of a User ID
 * @param {string} id User ID to encrypt
 * @requires process.env: ENCRYPTION_SECRET
 * @returns {string} encrypted ID 
 */
const encryptID = (id) => {
  const { ENCRYPTION_SECRET } = process.env;
  const cipher = cryptoJS.AES.encrypt(id, ENCRYPTION_SECRET);
  return cipher.toString();
};

/**
 * AES decryption of an encrypted User ID
 * @param {string} encryptedID Encrypted ID to decrypt
 * @requires process.env: ENCRYPTION_SECRET
 * @returns {string} decrypted ID 
 */
const decryptID = (encryptedID) => {
  const { ENCRYPTION_SECRET } = process.env;
  const bytes = cryptoJS.AES.decrypt(encryptedID, ENCRYPTION_SECRET);
  return bytes.toString(cryptoJS.enc.Utf8);
}

/**
 * Parses the JWT_OPTIONS String from the process environment
 * @param {string} stringOptions options in String form: "option: value, optionN: valueN, ..."
 * @returns {object} { algorithm, expiresIn, issuer }
 */
const parseTokenOptions = stringOptions => stringOptions
  .split(', ')
  .reduce(
    (options, option) => {
      const [optionKey, optionValue] = option.split(': ');
      options[optionKey] = optionValue;
      return options;
    },
    {},
  );

/**
 * Creates a JWT authentication token payload
 * @param {User} authedUser Authenticated User from request 
 * @returns {object} { id: <encrypted> }
 */
const createTokenPayload = authedUser => ({ id: encryptID(authedUser.id) }); 

/**
 * Creates an authentication token
 * @param {User} authedUser the authenticated User
 * @requires process.env: JWT_SECRET, JWT_OPTIONS
 * @returns JWT
 */
const createToken = (authedUser) => {
  const { JWT_SECRET, JWT_OPTIONS } = process.env;
  const options = parseTokenOptions(JWT_OPTIONS);
  const payload = createTokenPayload(authedUser);

  return jwt.sign(payload, JWT_SECRET, options);
}

module.exports = {
  encryptID,
  decryptID,
  parseTokenOptions,
  createTokenPayload,
  createToken,
};
