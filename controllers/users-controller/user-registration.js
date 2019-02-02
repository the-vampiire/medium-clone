const verifyPayload = ({ body }, res, next) => {
  const { username, password, verifyPassword } = body;
  
  if (!username) return res.status(400).json({ error: 'username missing' });
  if (!password) return res.status(400).json({ error: 'password missing' });
  if (!verifyPassword) return res.status(400).json({ error: 'verifyPassword missing' });
  if (password !== verifyPassword) return res.status(400).json({ error: 'Passwords do not match' });

  next();
};

const checkDuplicate = async ({ body, models }, res, next) => {
  const existingUser = await models.User.countDocuments({ username: body.username });
  if (existingUser !== 0) return res.status(409).json({ error: 'Username already registered' });

  next();
};

const registerUser = async ({ body, models }, res) => {
  const { username, password } = body;
  try {
    const newUser = await models.User.create({ username, password });
    return res.json(newUser.toResponseShape());
  } catch(registrationError) {
    // TODO: better handling
    return res.status(400).send(registrationError);
  }
};

module.exports = {
  verifyPayload,
  checkDuplicate,
  registerUser,
};
