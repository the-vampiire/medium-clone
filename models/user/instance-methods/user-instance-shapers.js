const { buildEndpoint, buildPagination } = require('../../../controllers/controller-utils');

function toResponseShape() {
  return {
    slug: this.slug,
    username: this.username,
    avatarURL: this.avatarURL,
    links: this.buildResourceLinks(),
  }
}

function buildResourceLinks() {
  const basePath = `users/${this.slug}`;
  return {
    userURL: buildEndpoint({ basePath }),
    followersURL: buildEndpoint({ basePath, path: 'followers', paginated: true }),
    followingURL: buildEndpoint({ basePath, path: 'following', paginated: true }),
    storiesURL: buildEndpoint({ basePath, path: 'stories', paginated: true }),
    responsesURL: buildEndpoint({ basePath, path: 'responses', paginated: true }),
    clappedStoriesURL: buildEndpoint({ basePath, path: 'clapped', paginated: true }),
  };
}

function shapeAuthoredStories(stories) {
  return Promise.all(
    stories.map(story => story.toResponseShape()),
  );
}

async function addStoriesPagination({
  limit,
  currentPage,
  stories,
  responses,
  published = true,
}) {
  const output = {};
  const match = { author: this, published };

  if (stories) {
    output.stories = stories;
    match.parent = null;
  } else if (responses) {
    output.responses = responses;
    match.parent = { $ne: null };
  }

  return this.addPagination({
    output,
    limit,
    currentPage,
    path: 'stories',
    totalDocuments: await this.model('stories').countDocuments(match).exec(),
  });
}

function addPagination(options) {
  return buildPagination({ ...options, basePath: `users/${this.slug}` });
}

module.exports = {
  toResponseShape,
  buildResourceLinks,
  addPagination,
  addStoriesPagination,
  shapeAuthoredStories,
};
