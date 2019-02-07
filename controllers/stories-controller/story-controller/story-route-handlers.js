/**
 * Handler for discovering an individual Story
 * @param {Request} req Request object 
 * @param req.pathStory: The story associated with this request path
 * @param {Response} res Response object
 * @returns JSON response with a Story Response Shape 
 */
const storyDiscoveryHandler = async (req, res) => {
  const { pathStory } = req;

  const response = await pathStory.toResponseShape();
  return res.json(response);
};

/**
 * Handler for updating a Story
 * - updates one or more of { title, body, published }
 * @requires Authentication and authorship
 * @param {Request} req Request object 
 * @param {Story} req.pathStory The story to be updated
 * @param {string} req.body.title [optional] A new title for the story
 * @param {string} req.body.body [optional]  A new body for the story
 * @param {boolean} req.body.published [optional]  Sets the published field value
 * @param {Response} res Response object
 * @returns JSON response with the updated story in Story Response Shape
 */
const storyUpdateHandler = async (req, res) => {
  const { pathStory, body: { title, body, published } } = req;
  
  const updateData = {};
  if (title) updateData.title = title;
  if (body) updateData.body = body;
  if (published !== undefined) updateData.published = published;
  
  const updatedStory = await pathStory.update(updateData);
  const response = await updatedStory.toResponseShape();
  
  return res.json(response);
}; 

/**
 * Handler for deleting a Story
 * - verifies the password of the authenticated user before deleting
 * @requires Authentication and authorship
 * @param {Request} req Request object 
 * @param {Story} req.pathStory The story to be deleted
 * @param {User} req.authedUser The authenticated User (author)
 * @param {string} req.body.password Author's password for final verification
 * @param {Response} res Response object
 * @returns password verification fails: 401 JSON response { error }
 * @returns password verification succeeds: 204 (no-content) response
 */
const storyDeleteHandler = async (req, res) => {
  const { pathStory, authedUser, body: { password } } = req;

  const verified = await authedUser.verifyPassword(password);
  if (!verified) return res.status(401).json({ error: 'failed to authenticate' });

  await pathStory.destroy();

  return res.status(204); // success + no content
};

module.exports = {
  storyDiscoveryHandler,
  storyUpdateHandler,
  storyDeleteHandler,
};
