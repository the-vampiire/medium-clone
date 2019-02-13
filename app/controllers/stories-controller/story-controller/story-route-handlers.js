/**
 * Handler for discovering an individual Story
 * @param {Request} req Request object 
 * @param req.context.pathStory: The story associated with this request path
 * @param {Response} res Response object
 * @returns JSON response with a Story Response Shape 
 */
const storyDiscoveryHandler = async (req, res) => {
  const { pathStory } = req.context;

  const response = await pathStory.toResponseShape();
  return res.json(response);
};

/**
 * Handler for updating a Story
 * - updates one or more of { title, body, published }
 * @requires Authentication and authorship
 * @param {Request} req Request object 
 * @param {Story} req.context.pathStory The story to be updated
 * @param {string} req.body.title [optional] A new title for the story
 * @param {string} req.body.body [optional]  A new body for the story
 * @param {boolean} req.body.published [optional]  Sets the published field value
 * @param {Response} res Response object
 * @returns JSON response with the updated story in Story Response Shape
 */
const storyUpdateHandler = async (req, res) => {
  const { pathStory } = req.context;
  const { title, body, published } = req.body;
  
  if (title) pathStory.title = title;
  if (body) pathStory.body = body;
  if (published !== undefined) {
    pathStory.published = published;
    pathStory.publishedAt = published ? new Date() : null;
  }
  
  const updatedStory = await pathStory.save();
  const response = await updatedStory.toResponseShape();
  
  return res.json(response);
}; 

/**
 * Handler for deleting a Story
 * @param {Request} req Request object 
 * @param {Story} req.context.pathStory The story to be deleted
 * @param {Response} res Response object
 * @returns 204 (no-content) response
 */
const storyDeleteHandler = async (req, res) => {
  const { pathStory } = req.context;

  await pathStory.remove();
  return res.sendStatus(204); // success + no content
};

module.exports = {
  storyDiscoveryHandler,
  storyUpdateHandler,
  storyDeleteHandler,
};
