require('dotenv').config();

const mongoose = require('mongoose');
const models = require('../index');
const {
  setup,
  teardown,
  mocks: { storyMock, clapMock },
} = require('../../test-utils');

// uncomment to see the mongodb queries themselves for debugging
// mongoose.set('debug', true);
describe('Story Model', () => {
  let userOne;
  let userTwo;
  let story;
  let reply;
  let clapsPerUser;
  beforeAll(async () => {
    const { MONGO_URI, MONGO_DB } = process.env;
    mongoose.connect(`${MONGO_URI}${MONGO_DB}`, { useNewUrlParser: true });

    const data = await setup({ userCount: 2 });
    [userOne, userTwo] = data.users;
    story = await models.Story.create(storyMock({ author: userOne }));
    reply = await models.Story.create(storyMock({ author: userOne, parent: story }));

    clapsPerUser = 20;
    await Promise.all(
      [userOne, userTwo].map(user => models.Clap.create({ user, story, count: clapsPerUser })),
    );
  });

  afterAll(async () => {
    const collections = ['users', 'stories', 'claps'];
    return teardown(mongoose, collections);
  });

  describe('virtuals', () => {
    describe('claps', () => {
      let claps;
      beforeAll(async () => {
        story = await story.populate('claps').execPopulate();
        claps = story.claps;
      });

      test('returns all the claps belonging to the story', () => {
        expect(claps).toBeDefined();
        expect(claps.length).toBe(2);
      });
    });

    describe('replies', () => {
      let replies;
      beforeAll(async () => {
        story = await story.populate('replies').execPopulate();
        replies = story.replies;
      });

      test('returns all the replies to the story', () => {
        expect(replies).toBeDefined();
        expect(replies.length).toBe(1);
        expect(replies[0].id).toEqual(reply.id);
      });
    });

    describe('slug', () => {
      let slug;
      beforeAll(() => {
        slug = story.slug;
      });

      test('returns a URL safe slug generated from the story\'s title', () => {
        expect(slug).toBeDefined();
        expect(slug).toEqual(story.title.toLowerCase().replace(' ', '-'));
      });
    });
  });

  describe('instance methods', () => {
    describe('getClapsCount()', () => {

    });
  });
});
