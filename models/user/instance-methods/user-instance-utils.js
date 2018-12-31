const { buildEndpoint } = require('../../../controllers/utils');

function buildResourceLinks() {
  const basePath = `user/${this.slug}`;
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
    stories.map(story => story.toResponseShape({ author: this }))
  );
}

async function addStoriesPagination({
  limit,
  currentPage,
  stories,
  published = true,
  responses = false,
}) {
  const match = { author: this, published };
  if (responses) match.parent = { $ne: null };
  else match.parent = null;

  return this.addPagination({
    limit,
    currentPage,
    path: 'stories',
    output: { stories },
    totalDocuments: await this.model('stories').countDocuments(match).exec(),
  });
}

// todo: tests
async function addPagination({
  path,
  output = {},
  limit = 10,
  currentPage = 0,
  totalDocuments,
}) {
  const paginatedOutput = { ...output };
  paginatedOutput.pagination = { limit, currentPage, hasNext: null, nextPageURL: null };

  const nextPage = currentPage + 1;
  const hasNext = totalDocuments > nextPage * limit;

  if (hasNext) {
    paginatedOutput.pagination.hasNext = hasNext;
    paginatedOutput.pagination.nextPageURL = buildEndpoint({
      path,
      limit,
      currentPage: nextPage,
      basePath: `user/${this.slug}`,
    });
  }

  return paginatedOutput;
};

module.exports = {
  buildResourceLinks,
  addPagination,
  addStoriesPagination,
  shapeAuthoredStories,
};
