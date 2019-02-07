// /user/@username/
// TODO: test userDiscovery and add JSDocs to all
const userDiscoveryHandler = async (req, res) => {
  const { pathUser } = req;
  return res.json(pathUser.toResponseShape());
};

const userStoriesHandler = ({ query: { limit, currentPage }, pathUser }, res) => pathUser
  .getStories({ limit, currentPage, onlyStories: true })
  .then(stories => pathUser.shapeAuthoredStories(stories))
  .then(stories => pathUser.addStoriesPagination({ stories, limit, currentPage }))
  .then(shapedStories => res.json(shapedStories))
  .catch(console.error);

const userResponsesHandler = ({ query: { limit, currentPage }, pathUser }, res) => pathUser
  .getStories({ limit, currentPage, onlyResponses: true })
  .then(responses => pathUser.shapeAuthoredStories(responses))
  .then(responses => pathUser.addStoriesPagination({ responses, limit, currentPage }))
  .then(shapedResponses => res.json(shapedResponses))
  .catch(console.error);

const userFollowingHandler = ({ pathUser }, res) => pathUser.getFollowing()
  .then(res.json)
  .catch(console.error);

const userClappedStoriesHandler = ({ pathUser }, res) => pathUser.getClappedStories()
  .then(res.json)
  .catch(console.error);

module.exports = {
  userDiscoveryHandler,
  userStoriesHandler,
  userResponsesHandler,
  userFollowingHandler,
  userClappedStoriesHandler,
};
