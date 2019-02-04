const createNewStory = async (req, res) => {
  const { body: { title, body }, authedUser, models } = req;

  if (!title) return res.status(400).json({ error: 'title missing' });
  
  const newStory = await models.Story.create({ title, body, author: authedUser });
  const responseShape = await newStory.toResponseShape(authedUser);

  return res.json(responseShape);
};

module.exports = {
  createNewStory,
};
