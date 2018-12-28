const {
  storyResourceLinks,
  userResourceLinks,
} = require('../resource-builders');

const shapeUserStoriesResponse = (req, stories) => {
  const { pathUser } = req;

  return Promise.all(
    stories.map(async (story) => {
      const populated = await story
        .populate('repliesCount')
        .populate({
          path: 'author',
          select: { _id: 1, username: 1, avatarURL: 1 },
        })
        .execPopulate();

      const storyResponse = populated.toJSON();

      // clean up ObjectId fields
      storyResponse.author.id = storyResponse.author._id.toHexString();
      delete storyResponse.author._id;
      storyResponse.id = storyResponse._id.toHexString();
      delete storyResponse._id;

      storyResponse.clapsCount = await story.getClapsCount();

      // add the Story resources property for discovery
      storyResponse.resources = await storyResourceLinks(story);

      storyResponse.author = Object.assign(
        storyResponse.author,
        // merge with the User resources property for discovery
        { resources: userResourceLinks(populated.author) },
      );

      return storyResponse;
    }),
  );
}

// todo: implement limit and pagination
const userStoriesHandler = (req, res) => req.pathUser.getStories()
  // .then(stories => { console.log(stories); return stories; })
  .then(stories => shapeUserStoriesResponse(req, stories))
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