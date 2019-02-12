const { buildEndpoint } = require('../../../controllers/pagination-utils');

async function toResponseShape() {
  const populated = await this.populate('repliesCount').populate('author').execPopulate();
  const output = populated.toJSON(); // Story object is not modifiable directly, convert to JSON

  // add custom response fields
  output.slug = populated.slug;
  output.author = populated.author.toResponseShape();
  output.clapsCount = await populated.getClapsCount();
  output.links = await populated.buildResourceLinks();

  // clean up unused fields
  delete output.__v;
  delete output._id;
  delete output.parent;

  return output;
}

async function buildResourceLinks() {
  const { parent, author, repliesCount, clappedUserCount } = await this
    .populate('repliesCount')
    .populate('clappedUserCount')
    .populate('parent', 'title')
    .populate('author', 'username')
    .execPopulate();
  
  const basePath = `stories/${this.slug}`;

  const parentURL = parent 
    ? buildEndpoint({ basePath: `stories/${parent.slug}` })
    : null;

  const repliesURL = repliesCount
    ? buildEndpoint({ basePath, path: 'replies', paginated: true })
    : null;

  const clappedReadersURL = clappedUserCount
    ? buildEndpoint({ basePath, path: 'clapped', paginated: true })
    : null;

  return {
    storyURL: buildEndpoint({ basePath }),
    authorURL: buildEndpoint({ basePath: `users/${author.slug}`}),
    parentURL,
    repliesURL,
    clappedReadersURL,
  };
};

module.exports = {
  toResponseShape,
  buildResourceLinks,
};
