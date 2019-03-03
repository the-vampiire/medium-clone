const bcrypt = require('bcrypt');
const { extractFieldErrors, newResourceResponse } = require('../controller-utils');

/**
 * Validates the incoming User registration payload
 * - contains required params
 * - password matches verifyPassword
 * - calls next() if validation passes
 * @param {Request} req Request object
 * @param {string} req.body.username the username to register
 * @param {string} req.body.password the password to register
 * @param {string} req.body.verifyPassword the verifyPassword confirmation
 * @param {Response} res Response object
 * @param {Function} next next step function 
 * @returns missing required parameters: 400 JSON response with { error: 'X required' }
 * @returns passwords do not match: 400 JSON response with { error: 'passwords do not match' }
 */
const verifyRegistrationPayload = (req, res, next) => {
  const { username, password, verifyPassword } = req.body;
  
  if (!username) return res.status(400).json({ error: 'username required' });
  if (!password) return res.status(400).json({ error: 'password required' });
  if (!verifyPassword) return res.status(400).json({ error: 'verifyPassword required' });
  if (password !== verifyPassword) return res.status(400).json({ error: 'passwords do not match' });

  next();
};

/**
 * Checks if the username has already been registered
 * - calls next() if username is available
 * @param {Request} req Request object
 * @param {string} req.body.username the username to register
 * @param {object} req.models DB models
 * @param {Response} res Response object
 * @param {Function} next next step function 
 * @returns username taken: 409 JSON response with { error }
 */
const checkDuplicateRegistration = async (req, res, next) => {
  const { body, context: { models } } = req;
 
  const existingUser = await models.User.countDocuments({ username: body.username });
  if (existingUser !== 0) return res.status(409).json({ error: 'username already registered' });

  next();
};

/**
 * POST handler for registering a new User
 * - hashes the user's password
 * - registers a new user
 * - sets the Location header for the newly created User URL
 * @param {Request} req Request object
 * @param {string} req.body.username the username to register
 * @param {string} req.body.password the password to register
 * @param {object} req.context.models DB models
 * @param {string} req.context.env.SALT_ROUNDS password encryption salt rounds
 * @param {Response} res Response object
 * @returns validation failure: 400 JSON response with { error, fields: { ... } }
 * @returns 201 JSON response with User Response Shape and Location header
 */
const registerUserHandler = async (req, res) => {
  const { body: { username, password }, context: { env, models } } = req;

  const encryptedPassword = await bcrypt.hash(password, Number(env.SALT_ROUNDS));

  let newUser;
  try {
    newUser = await models.User.create({ username, password: encryptedPassword });
  } catch(validationError) {
    const fields = extractFieldErrors(validationError.errors);
    return res.status(400).json({ error: 'registration validation failed', fields });
  }

  const responseData = newUser.toResponseShape();

  return newResourceResponse(responseData, 'userURL', res);
};

module.exports = {
  verifyRegistrationPayload,
  checkDuplicateRegistration,
  registerUserHandler,
};
