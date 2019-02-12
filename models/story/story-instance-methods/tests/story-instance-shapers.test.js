const { User, Story } = require('../../../index');
const { mocks } = require('../../../../test-utils');
const { buildResourceLinks, toResponseShape } = require('../story-instance-shapers');

const populaterStub = {
  populate() { return this; },
  execPopulate() { return new Promise(res => res(this)); },
}

const author = new User(mocks.userMock());

describe('Story instance shaper methods', () => {
  describe('buildResourceLinks(): { storyURL, authorURL, parentURL, repliesURL, clappedReadersURL }', () => {
    const buildLinksStub = ({ parent = null, repliesCount = 0, clappedUserCount = 0 }) => Object.assign(
      {},
      new Story(mocks.storyMock({})),
      { author, parent, repliesCount, clappedUserCount, buildResourceLinks },
      populaterStub,
    );

    test('story with no claps: only storyURL and authorURL are not null', async () => {
      const storyMock = buildLinksStub({});

      const output = await storyMock.buildResourceLinks();
      expect(output.storyURL.length).toBeGreaterThan(1);
      expect(output.authorURL.length).toBeGreaterThan(1);
      expect(output.parentURL).toBeNull();    
      expect(output.repliesURL).toBeNull();    
      expect(output.clappedReadersURL).toBeNull();    
    });

    test('story with claps: storyURL, authorURL, and clappedReadersURL are not null', async () => {
      const storyMock = buildLinksStub({ clappedUserCount: 1 });

      const output = await storyMock.buildResourceLinks();
      expect(output.storyURL.length).toBeGreaterThan(1);
      expect(output.authorURL.length).toBeGreaterThan(1);
      expect(output.clappedReadersURL.length).toBeGreaterThan(1);
      expect(output.parentURL).toBeNull();    
      expect(output.repliesURL).toBeNull();    
    });

    test('story with claps and replies: storyURL, authorURL, clappedReadersURL, and repliesURL are not null', async () => {
      const storyMock = buildLinksStub({ clappedUserCount: 1, repliesCount: 1 });

      const output = await storyMock.buildResourceLinks();
      expect(output.storyURL.length).toBeGreaterThan(1);
      expect(output.authorURL.length).toBeGreaterThan(1);
      expect(output.repliesURL.length).toBeGreaterThan(1);    
      expect(output.clappedReadersURL.length).toBeGreaterThan(1);
      expect(output.parentURL).toBeNull();
    });

    describe('reply story: a Story reply to another Story', () => {
      const parent = new Story(mocks.storyMock({ author }));
      const replyMock = buildLinksStub({ parent });
      
      let output;
      beforeAll(async () => { output = await replyMock.buildResourceLinks(); });

      test('parentURL is not null', async () => {
        expect(output.storyURL.length).toBeGreaterThan(1);
        expect(output.parentURL.length).toBeGreaterThan(1);
        expect(output.repliesURL).toBeNull();    
        expect(output.clappedReadersURL).toBeNull();
      });

      test('parentURL uses the parent Story\'s slug', () => {
        /* VERY BRITTLE - what can be done? */
        const urlSlugIndex = output.storyURL.indexOf('/stories/');
        const slug = output.parentURL.slice(urlSlugIndex + '/stories/'.length)
        
        expect(slug).toBe(parent.slug);
      });
    });
  });

  describe('toResponseShape(): shapes a Story as a response object', () => {
    const responseShapeStub = () => Object.assign(
      new Story(mocks.storyMock({ author, published: true })),
      populaterStub,
      {
        getClapsCount: () => 1, // tested, can be mocked
        buildResourceLinks: () => true, // tested, can be mocked
        toResponseShape, // to test
      },
    );

    const storyMock = responseShapeStub();

    let output;
    beforeAll(async () => { output = await storyMock.toResponseShape(); });

    test('strips fields: ["__v", "_id", "parent"]', async () => {
      ["__v", "_id", "parent"].forEach(
        strippedField => expect(output).not.toHaveProperty(strippedField),
      );
    });

    test('adds fields: ["slug", "clapsCount", "author", "links"]', () => {
      ["slug", "clapsCount", "author", "links"]
        .forEach(expectedField => expect(output).toHaveProperty(expectedField));
    });

    test('author field has User Response Shape with User Resource Links field "links"', () => {
      expect(output.author.links).toBeDefined();
    });
  });
});