const requireAuthedUser = (req, res, next) => {
  // get user
  // user not found -> res: 401 (unauthorized)
  // user found -> attach as req.authedUser
  next();
};

module.exports = {
  requireAuthedUser,
};
