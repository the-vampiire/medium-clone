const { createToken } = require('./token-utils');

/**
 * Responds with an authentication JWT
 * @param {Response} res the Response object
 * @param {Request} req the Request object
 * @param {User} req.context.authedUser the authenticated User
 * @returns a 200 JSON response with the JWT as content: { token } 
 */
const createTokenHandler = (req, res) => {
  const { authedUser } = req.context;

  const token = createToken(authedUser);
  return res.json({ token });
};

module.exports = createTokenHandler;