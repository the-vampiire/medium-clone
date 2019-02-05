const { buildEndpoint } = require('../../../controllers/controller-utils');

async function toResponseShape() {
  const populated = await this.populate('repliesCount').populate('author').execPopulate();

  // shape response fields
  populated.slug = populated.slug;
  populated.author = populated.author.toResponseShape();
  populated.clapsCount = await populated.getClapsCount();
  populated.links = await populated.buildResourceLinks();

  // clean up unused fields
  delete populated.__v;
  delete populated._id;
  delete populated.parent;

  return populated;
}

async function buildResourceLinks() {
  const basePath = `stories/${this.slug}`;
  
  const populated = await this
    .populate('repliesCount')
    .populate('clappedUserCount')
    .populate('parent', 'title')
    .execPopulate();

  // 'count' virtuals are only accessible after converting to JSON
  const { parent, repliesCount, clappedUserCount } = populated;

  const parentURL = parent 
    ? buildEndpoint({ basePath: `stories/${parent.slug}` })
    : null;

  const repliesURL = repliesCount
    ? buildEndpoint({ basePath, path: 'replies', paginated: true })
    : null;

  // TODO: rename to clappedMembersURL
  const clappedUsersURL = clappedUserCount
    ? buildEndpoint({ basePath, path: 'clapped', paginated: true })
    : null;

  return {
    storyURL: buildEndpoint({ basePath }),
    parentURL,
    repliesURL,
    clappedUsersURL,
  };
};

module.exports = {
  toResponseShape,
  buildResourceLinks,
};
