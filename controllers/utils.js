const buildEndpoint = ({ basePath, path, paginated = false }) => `${process.env.domain}/${basePath || ''}/${path || ''}${paginated ? `?${paginationDefault()}` : ''}`;

const paginationDefault = () => 'limit=10&page=0';

const userResourceLinks = (user) => {
  const basePath = `user/${user.slug}`;
  return {
    userURL: buildEndpoint(basePath),
    followersURL: buildEndpoint(`${basePath}/followers`),
    followingURL: buildEndpoint(`${basePath}/following`),
    storiesURL: buildEndpoint(`${basePath}/stories?${paginationDefault()}`),
    responsesURL: buildEndpoint(`${basePath}/responses?${paginationDefault()}`),
    clappedStoriesURL: buildEndpoint(`${basePath}/clapped?${paginationDefault()}`),
  };
}

module.exports = {
  buildEndpoint,
  paginationDefault,
  userResourceLinks,
};
