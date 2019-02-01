const verifyPayload = ({ body }, res, next) => {
  const { username, password, verifyPassword } = body;
  
  if (!username) return res.status(400).send('Username required');
  if (!password) return res.status(400).send('Password required');
  if (!verifyPassword) return res.status(400).send('Password verification required');
  if (password !== verifyPassword) return res.status(400).send('Passwords do not match');

  next();
};

const checkDuplicate = async ({ body, models }, res, next) => {
  const existingUser = await models.User.countDocuments({ username: body.username });
  if (existingUser !== 0) return res.status(409).send('Username unavailable');

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
