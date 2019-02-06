const mongoose = require('mongoose');
const { User, Story, Clap } = require('../../index');
const { dbConnect, teardown, mocks } = require('../../../test-utils');

describe('Story Model Virtual fields', () => {
  beforeAll(() => dbConnect(mongoose));
  afterAll(() => {
    const collections = ['users', 'stories', 'claps'];
    return teardown(mongoose, collections);
  });

  test('.slug: returns a URL safe slug using the Story title and ID', async () => {
    const title = 'this is the title';
    const expectedTitle = 'this-is-the-title';
    const story = await new Story(mocks.storyMock({ title }));
    expect(story.slug).toBe(`${expectedTitle}-${story.id}`);
  });

  describe('Clap related virtuals', () => {
    let story, clap;
    beforeAll(async () => {
      const author = await User.create(mocks.userMock());
      const clappingMember = await User.create(mocks.userMock());
      story = await Story.create(mocks.storyMock({ author }));
      clap = await Clap.create(mocks.clapMock({ user: clappingMember, story, count: 20 }));
    });

    test('.claps: returns all Clap documents belonging to the Story', async () => {
      const populated = await story.populate('claps').execPopulate();
      expect(populated.claps).toBeDefined();
      expect(populated.claps.length).toBe(1);
      expect(populated.claps[0].id).toBe(clap.id);
    });

    test('.clappedUserCount: returns a count of the total number of Users who clapped for the Story', async () => {
      const populated = await story.populate('clappedUserCount').execPopulate();
      expect(populated.clappedUserCount).toBeDefined();
      expect(populated.clappedUserCount).toBe(1);
    });
  });

  describe('Replies related virtuals', () => {
    let story, reply;
    beforeAll(async () => {
      const author = await User.create(mocks.userMock());
      const responder = await User.create(mocks.userMock());
      story = await Story.create(mocks.storyMock({ author }));
      reply = await Story.create(mocks.storyMock({ author: responder, parent: story }));
    });

    test('.replies: returns all Reply Story documents belonging to the Story', async () => {
      const populated = await story.populate('replies').execPopulate();
      expect(populated.replies).toBeDefined();
      expect(populated.replies.length).toBe(1);
      expect(populated.replies[0].id).toBe(reply.id);
    });

    test('.repliesCount: returns a count of the total number of Reply Stories belonging to the Story', async () => {
      const populated = await story.populate('repliesCount').execPopulate();
      expect(populated.repliesCount).toBeDefined();
      expect(populated.repliesCount).toBe(1);
    });
  });
});