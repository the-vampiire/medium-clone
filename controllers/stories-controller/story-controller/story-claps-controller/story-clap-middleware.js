const injectStoryClap = async (req, res, next) => {
  const { pathUser, pathStory, context: { models } } = req;

  const pathClap = await models.Clap.findOne({ reader: pathUser, story: pathStory });
  if (!pathClap) return res.status(400).json({ error: 'clap not found' });
  
  req.pathClap = pathClap;
  next();
};

module.exports = {
  injectStoryClap,
};
