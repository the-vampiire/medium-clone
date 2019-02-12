const { buildEndpoint } = require('../../controllers/pagination-utils');

/**
 * @returns Clap response shape { count, createdAt, updatedAt, links }
 */
async function toResponseShape() {
  const { count, createdAt, updatedAt } = this;
  return {
    count,
    createdAt,
    updatedAt,
    links: await this.buildResourceLinks(),
  };
}

/**
 * Builds the Clap resource links
 * @returns Clap resource links { clapURL, storyURL, readerURL }
 */
async function buildResourceLinks() {
  const { story, reader } = await this
    .populate('story', 'title')
    .populate('reader', 'username')
    .execPopulate();

  const storyBasePath = `stories/${story.slug}`;

  const storyURL = buildEndpoint({ basePath: storyBasePath });
  const readerURL = buildEndpoint({ basePath: `users/${reader.slug}` });
  const clapURL = buildEndpoint({ basePath: storyBasePath, path: `claps/${reader.slug}` });

  return {
    clapURL,
    storyURL,
    readerURL,
  };
}

module.exports = {
  toResponseShape,
  buildResourceLinks,
};
