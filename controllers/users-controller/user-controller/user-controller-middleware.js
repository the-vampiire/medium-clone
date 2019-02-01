const exchangeSlugForUser = async (req, _, next) => {
  const { params: { usernameSlug }, models } = req;
  const username = usernameSlug.replace('@', ''); // remove @ character from slug

  // add the 'pathUser' property to the req object for use downstream
  // this is the user with the username from the path /user/@username/
  req.pathUser = await models.User.findOne({ username });
  next();
};

const userNotFoundRedirect = (req, res, next) => {
  // if the path user is not found return a 404
  if (!req.pathUser) return res.status(404).send('User not found');
  next(); // otherwise proceeed to next handler
};

module.exports = {
  exchangeSlugForUser,
  userNotFoundRedirect,
};