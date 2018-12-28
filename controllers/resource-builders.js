const buildEndpoint = path => `${process.env.domain}/${path}`;

const paginationDefault = () => '?limit=10&page=0';

const storyResourceLinks = async (story) => {
  const basePath = `story/${story.slug}`;
  const { parent } = await story.populate('parent', 'title').execPopulate();
  return {
    storyURL: buildEndpoint(`${basePath}`),
    parentURL: story.parent ? buildEndpoint(`story/${parent.slug}`) : null,
    repliesURL: buildEndpoint(`${basePath}/replies${paginationDefault()}`),
    clappedUsersURL: buildEndpoint(`${basePath}/clapped${paginationDefault()}`),
  };
}

const userResourceLinks = (user) => {
  const basePath = `user/${user.slug}`;
  return {
    userURL: buildEndpoint(basePath),
    followersURL: buildEndpoint(`${basePath}/followers`),
    followingURL: buildEndpoint(`${basePath}/following`),
    storiesURL: buildEndpoint(`${basePath}/stories${paginationDefault()}`),
    responsesURL: buildEndpoint(`${basePath}/responses${paginationDefault()}`),
    clappedStoriesURL: buildEndpoint(`${basePath}/clapped${paginationDefault()}`),
  };
}

module.exports = {
  buildEndpoint,
  storyResourceLinks,
  userResourceLinks,
};
