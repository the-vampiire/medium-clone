const newStoryHandler = async (req, res) => {
  const { body: { title, body }, authedUser, models } = req;

  if (!title) return res.status(400).json({ error: 'title missing' });
  
  const newStory = await models.Story.create({ title, body, author: authedUser });
  const responseShape = await newStory.toResponseShape();

  return res.json(responseShape);
};

const latestStoriesHandler = async (req, res) => {
  const { query, models } = req;
  return res.json(models.Story.getLatestStories(query));
};

module.exports = {
  newStoryHandler,
  latestStoriesHandler,
};
