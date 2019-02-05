const { User, Story } = require('../../../index');
const { mocks } = require('../../../../test-utils');
const { buildResourceLinks, toResponseShape } = require('../story-instance-shapers');

const populaterMock = {
  populate() { return this; },
  execPopulate() { return new Promise(res => res(this)); },
}

describe('Story instance shaper methods', () => {
  describe('buildResourceLinks(): { storyURL, parentURL, repliesURL, clappedUsersURL }', () => {
    const author = new User(mocks.userMock());

    const resourceMock = ({ parent = null, repliesCount = 0, clappedUserCount = 0 }) => Object.assign(
      new Story(mocks.storyMock({ author })),
      { parent, repliesCount, clappedUserCount, buildResourceLinks },
      populaterMock,
    );

    test('story with no claps: only storyURL is not null', async () => {
      const storyMock = resourceMock({});

      const output = await storyMock.buildResourceLinks();
      expect(output.storyURL.length).toBeGreaterThan(1);
      expect(output.parentURL).toBeNull();    
      expect(output.repliesURL).toBeNull();    
      expect(output.clappedUsersURL).toBeNull();    
    });

    test('story with claps: storyURL and clappedUsersURL are not null', async () => {
      const storyMock = resourceMock({ clappedUserCount: 1 });

      const output = await storyMock.buildResourceLinks();
      expect(output.storyURL.length).toBeGreaterThan(1);
      expect(output.clappedUsersURL.length).toBeGreaterThan(1);
      expect(output.parentURL).toBeNull();    
      expect(output.repliesURL).toBeNull();    
    });

    test('story with claps and replies: storyURL, clappedUsersURL, and repliesURL are not null', async () => {
      const storyMock = resourceMock({ clappedUserCount: 1, repliesCount: 1 });

      const output = await storyMock.buildResourceLinks();
      expect(output.storyURL.length).toBeGreaterThan(1);
      expect(output.repliesURL.length).toBeGreaterThan(1);    
      expect(output.clappedUsersURL.length).toBeGreaterThan(1);
      expect(output.parentURL).toBeNull();
    });

    describe('reply story: a Story reply to another Story', () => {
      const parent = new Story(mocks.storyMock({ author }));
      const replyMock = resourceMock({ parent });
      
      let output;
      beforeAll(async () => { output = await replyMock.buildResourceLinks(); });

      test('parentURL is not null', async () => {
        expect(output.storyURL.length).toBeGreaterThan(1);
        expect(output.parentURL.length).toBeGreaterThan(1);
        expect(output.repliesURL).toBeNull();    
        expect(output.clappedUsersURL).toBeNull();
      });

      test('parentURL uses the parent Story\'s slug', () => {
        /* VERY BRITTLE - what can be done? */
        const urlSlugIndex = output.storyURL.indexOf('/stories/');
        const slug = output.parentURL.slice(urlSlugIndex + '/stories/'.length)
        
        expect(slug).toBe(parent.slug);
      });
    });
  });
});