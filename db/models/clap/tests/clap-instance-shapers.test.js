const { paginationUtils: { buildEndpoint } } = require('../../../../app/controllers');
const { toResponseShape, buildResourceLinks } = require('../clap-instance-shapers');

jest.mock('../../../../app/controllers', () => ({ paginationUtils: { buildEndpoint: jest.fn() } }));

const populaterMock = {
  populate: jest.fn(() => populaterMock),
  execPopulate: jest.fn(),
};

describe('Clap instance shaper methods', () => {
  describe('buildResourceLinks(): builds the Clap resource links', () => {
    const storyMock = { id: 'anID', title: 'a title', slug: 'a-title-anID' };
    const userMock = { username: 'the-vampiire', slug: '@the-vampiire' };
    const clapMock = Object.assign(
      { story: storyMock, reader: userMock, buildResourceLinks },
      populaterMock,
    );

    populaterMock.execPopulate.mockImplementation(() => clapMock);

    let output;
    beforeAll(async () => { output = await clapMock.buildResourceLinks(); });
    afterAll(() => jest.clearAllMocks());

    test('populates the story title and reader username', () => {
      expect(populaterMock.populate).toHaveBeenCalledWith('story', 'title');
      expect(populaterMock.populate).toHaveBeenCalledWith('reader', 'username');
      expect(populaterMock.execPopulate).toHaveBeenCalled();
    });

    test('builds the story URL: { basePath: "stories/${story.slug}" }', () => {
      const basePath = `stories/${storyMock.slug}`;
      expect(buildEndpoint).toHaveBeenCalledWith({ basePath });
    });

    test('builds the reader URL: { basePath: "users/${reader.slug}" }', () => {
      const basePath = `users/${userMock.slug}`;
      expect(buildEndpoint).toHaveBeenCalledWith({ basePath });
    });

    test('builds the clap URL: { basePath: <story base>, path: "claps/${reader.slug}" }', () => {
      const basePath = `stories/${storyMock.slug}`;
      const path = `claps/${userMock.slug}`;
      expect(buildEndpoint).toHaveBeenCalledWith({ basePath, path });
    });

    test('returns the clap resources: { clapURL, storyURL, readerURL }', () => {
      ['clapURL', 'storyURL', 'readerURL'].forEach(
        expectedProperty => expect(output).toHaveProperty(expectedProperty),
      );
    });
  });

  describe('toResponseShape(): shapes the Clap for an endpoint response', () => {
    const clapMock = {
      count: 10,
      toResponseShape,
      buildResourceLinks: jest.fn(() => ({})),
    };

    let output;
    beforeAll(async () => { output = await clapMock.toResponseShape(); });

    test('calls buildResourceLinks()', () => {
      expect(clapMock.buildResourceLinks).toHaveBeenCalled();
    });

    test('returns the Clap Response Shape: { count, links }', () => {
      ['count', 'links'].forEach(
        expectedProperty => expect(output).toHaveProperty(expectedProperty),
      )
    });
  });
});
