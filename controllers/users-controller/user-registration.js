const verifyPayload = (req, res, next) => {
  const { username, password, verifyPassword } = req.body;
  
  if (!username) return res.status(400).json({ error: 'username missing' });
  if (!password) return res.status(400).json({ error: 'password missing' });
  if (!verifyPassword) return res.status(400).json({ error: 'verifyPassword missing' });
  if (password !== verifyPassword) return res.status(400).json({ error: 'Passwords do not match' });

  next();
};

const checkDuplicate = async (req, res, next) => {
  const { body, models } = req;
 
  const existingUser = await models.User.countDocuments({ username: body.username });
  if (existingUser !== 0) return res.status(409).json({ error: 'Username already registered' });

  next();
};

const registerUser = async (req, res) => {
  const { body: { username, password }, models } = req;

  try {
    const newUser = await models.User.create({ username, password });
    return res.json(newUser.toResponseShape());
  } catch(validationError) {
    return res.status(400).json({ error: validationError.message });
  }
};

module.exports = {
  verifyPayload,
  checkDuplicate,
  registerUser,
};
