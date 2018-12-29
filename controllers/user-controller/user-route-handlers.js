const userStoriesHandler = (
  { pathUser, query }, // todo: get viewingUser (requesting User) from req
  res,
) => pathUser.getPublishedStories(query.limit, query.currentPage)
  .then(stories => Promise.all(
    stories.map(story => story.toResponseShape({ author: pathUser, query })),
  ))
  .then(stories => pathUser.addStoriesPagination({ stories, query }))
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