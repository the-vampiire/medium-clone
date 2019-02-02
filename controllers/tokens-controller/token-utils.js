const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { SALT_ROUNDS } = require('../../models/user');

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
 * - Payload can be used for instant client-side access to common fields
 *  - username
 *  - avatarURL
 * @param {User} authedUser Authenticated User from request 
 * @param {number} saltRounds Number of salt rounds used for hashing the User ID
 * @returns {object} { id, username, avatarURL }
 */
const createTokenPayload = async (authedUser, saltRounds) => {
  const { id, username, avatarURL } = authedUser;
  const hashedID = await bcrypt.hash(id, saltRounds);

  return { id: hashedID, username, avatarURL };
};

/**
 * Creates and responds with an authentication JWT
 * @param {Request} req the Request object
 * @param {User} req.authedUser the authenticated User
 * @param {Response} res the Response object
 * @requires SALT_ROUNDS constant from User model exports
 * @requires process.env: JWT_SECRET, JWT_OPTIONS
 * @returns a 200 JSON response with the JWT as content: { token } 
 */
const createTokenHandler = async (req, res) => {
  const { authedUser } = req;
  const { JWT_SECRET, JWT_OPTIONS } = process.env;

  const payload = await createTokenPayload(authedUser, SALT_ROUNDS);
  const options = parseTokenOptions(JWT_OPTIONS);
  const token = jwt.sign(payload, JWT_SECRET, options);

  return res.json({ token });
};

module.exports = {
  parseTokenOptions,
  createTokenPayload,
  createTokenHandler,
};
