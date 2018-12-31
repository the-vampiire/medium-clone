const userStoriesHandler = ({ query: { limit, currentPage }, pathUser }, res) => pathUser
  .getStories({ limit, currentPage, onlyStories: true })
  .then(stories => pathUser.shapeAuthoredStories(stories)) // shape for response
  .then(stories => pathUser.addStoriesPagination({ stories, onlyStories: true, limit, currentPage }))
  .then(res.json)
  .catch(console.error);

const userFollowingHandler = ({ pathUser }, res) => pathUser.getFollowing()
  .then(res.json)
  .catch(console.error);

const userResponsesHandler = ({ pathUser }, res) => pathUser.getResponses()
  .then(res.json)
  .catch(console.error);

const userClappedHandler = ({ pathUser }, res) => pathUser.getClappedStories()
  .then(res.json)
  .catch(console.error);

module.exports = {
  userStoriesHandler,
  userFollowingHandler,
  userResponsesHandler,
  userClappedHandler,
};
