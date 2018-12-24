const exchangeSlugForUser = (req, _, next) => {
  const { params: { usernameSlug }, models } = req;
  const username = usernameSlug.replace('@', ''); // remove @ character

  // look up with case insensitive search for username
  // add the 'pathUser' property to the req object for use downstream
  // this is the user corresponding to the path /user/@username/
  req.pathUser = models.User.findOne({ $ilike: { username } });
};

const userNotFoundRedirect = (req, res, next) => {
  // if the path user is not found return a 404
  if (!req.pathUser) return res.status(404);
  next(); // otherwise proceeed to next handler
};

module.exports = {
  exchangeSlugForUser,
  userNotFoundRedirect,
};