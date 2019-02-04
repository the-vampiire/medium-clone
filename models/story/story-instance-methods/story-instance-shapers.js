const { buildEndpoint } = require('../../../controllers/controller-utils');

async function toResponseShape() {
  const populated = await this.populate('repliesCount').populate('author').execPopulate();
  const storyResponse = populated.toJSON();

  // todo: get viewing user (reader) from request
  // const readerClap = await this.model('claps').findOne(
  //   { user: reader, story: this },
  //   'count',
  // );
  // todo: implement and tests
  // storyResponse.readerClapsCount = readerClap ? readerClap.count : null;

  // shape response fields
  storyResponse.slug = this.slug;
  storyResponse.author = this.author.toResponseShape();
  storyResponse.clapsCount = await this.getClapsCount();
  storyResponse.links = await this.buildResourceLinks();

  // clean up unused fields
  delete storyResponse.__v;
  delete storyResponse._id;
  delete storyResponse.parent;

  return storyResponse;
}

async function buildResourceLinks() {
  const basePath = `stories/${this.slug}`;
  
  const populated = await this
    .populate('repliesCount')
    .populate('clappedUserCount')
    .populate('parent', 'title')
    .execPopulate();

  // 'count' virtuals are only accessible after converting to JSON
  const { repliesCount, clappedUserCount } = populated.toJSON();

  // need parent Story object to call .slug virtual, cant access from JSON
  const parent = populated.parent;

  const storyURL = buildEndpoint({ basePath });

  const parentURL = parent 
    ? buildEndpoint({ basePath: `story/${parent.slug}` })
    : null;

  const repliesURL = repliesCount
    ? buildEndpoint({ basePath, path: 'replies', paginated: true })
    : null;

  const clappedUsersURL = clappedUserCount
    ? buildEndpoint({ basePath, path: 'clapped', paginated: true })
    : null;

  return {
    storyURL,
    parentURL,
    repliesURL,
    clappedUsersURL,
  };
};

module.exports = {
  toResponseShape,
  buildResourceLinks,
};
