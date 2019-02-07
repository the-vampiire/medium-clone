const { extractFieldErrors } = require('../controller-utils');

const verifyPayload = (req, res, next) => {
  const { username, password, verifyPassword } = req.body;
  
  if (!username) return res.status(400).json({ error: 'username required' });
  if (!password) return res.status(400).json({ error: 'password required' });
  if (!verifyPassword) return res.status(400).json({ error: 'verifyPassword required' });
  if (password !== verifyPassword) return res.status(400).json({ error: 'passwords do not match' });

  next();
};

const checkDuplicate = async (req, res, next) => {
  const { body, models } = req;
 
  const existingUser = await models.User.countDocuments({ username: body.username });
  if (existingUser !== 0) return res.status(409).json({ error: 'username already registered' });

  next();
};

const registerUser = async (req, res) => {
  const { body: { username, password }, models } = req;

  let newUser;
  try {
    newUser = await models.User.create({ username, password });
  } catch(validationError) {
    const fields = extractFieldErrors(validationError.errors);
    return res.status(400).json({ error: 'validation failed', fields });
  }

  const responseShape = newUser.toResponseShape();

  res.set({ Location: responseShape.links.userURL });
  return res.status(201).json(responseShape);
};

module.exports = {
  verifyPayload,
  checkDuplicate,
  registerUser,
};
