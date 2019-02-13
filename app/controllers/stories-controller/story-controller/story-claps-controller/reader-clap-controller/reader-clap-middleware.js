const requireClapOwnership = (req, res, next) => {
  const { authedUser, pathClap } = req.context;

  if (pathClap.reader.toString() !== authedUser.id) {
    return res.status(401).json({ error: 'clap ownership required' });
  }

  next();
};

module.exports = {
  requireClapOwnership,
};
