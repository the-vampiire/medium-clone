const { newResourceResponse } = require('../../controller-utils');

const storyRepliesHandler = async (req, res) => {
  const { context: { pathStory }, query } = req;
  const { replies, pagination } = await pathStory.getReplies(query);
  
  return res.json({ replies, pagination });
};

const createStoryReplyHandler = async (req, res) => {
  // title is automatically derived from first sentence of the reply body
  const { context: { pathStory, authedUser }, body: { body } } = req;

  if (!body) return res.status(400).json({ error: 'body required' });

  let newReply;
  try {
    newReply = await authedUser.respondToStory(pathStory.id, body, new Date());
  } catch(error) {
    const { status, message } = error;
    return res.status(status).json({ error: message });
  }
  
  const responseData = await newReply.toResponseShape();

  return newResourceResponse(responseData, 'storyURL', res);
};

module.exports = {
  storyRepliesHandler,
  createStoryReplyHandler,
};
