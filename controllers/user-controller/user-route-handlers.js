const buildEndpoint = path => `${process.env.domain}/${path}`;

const storyResourceLinks = (story) => ({
  story_url: buildEndpoint(`story/${story.slug}`),
  replies_url: buildEndpoint(`story/${story.slug}/replies?limit=5&page=0`),
  clapped_users_url: buildEndpoint(`story/${story.slug}/clapped?limit=10&page=0`),
});

const userResourceLinks = (user) => {
  const basePath = `user/${user.slug}`;
  return {
    user_url: buildEndpoint(basePath),
    followers_url: buildEndpoint(`${basePath}/followers`),
    following_url: buildEndpoint(`${basePath}/following`),
    stories_url: buildEndpoint(`${basePath}/stories?limit=5&page=0`),
    responses_url: buildEndpoint(`${basePath}/responses?limit=5&page=0`),
    clapped_stories_url: buildEndpoint(`${basePath}/clapped?limit=5&page=0`),
  };
}

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

      storyResponse.claps_count = await story.getClapsCount();

      // clean up ObjectId fields
      storyResponse.author.id = storyResponse.author._id.toHexString();
      delete storyResponse.author._id;
      storyResponse.id = storyResponse._id.toHexString();
      delete storyResponse._id;

      if (populated.parent) {
        const { parent } = await story.populate({ path: 'parent', select: { title: 1 } });
        storyResponse.parentURL = populated.parent && buildEndpoint(`story/${parent.slug}`);
      }

      storyResponse.author = Object.assign(
        storyResponse.author,
        { links: userResourceLinks(populated.author) },
      );
      storyResponse.links = storyResourceLinks(story);
      return storyResponse;
    }),
  );
}

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