const injectStoryClap = async (req, res, next) => {
  const { pathUser, pathStory, models } = req.context;

  const pathClap = await models.Clap.findOne({ reader: pathUser, story: pathStory });
  if (!pathClap) return res.status(404).json({ error: 'clap not found' });
  
  req.context.pathClap = pathClap;
  next();
};

module.exports = {
  injectStoryClap,
};
