const { createToken } = require('./token-utils');

/**
 * Responds with an authentication JWT
 * @param {Response} res the Response object
 * @param {Request} req the Request object
 * @param {User} req.authedUser the authenticated User
 * @returns a 200 JSON response with the JWT as content: { token } 
 */
const createTokenHandler = (req, res) => {
  const token = createToken(req.authedUser);
  return res.json({ token });
};

module.exports = createTokenHandler;