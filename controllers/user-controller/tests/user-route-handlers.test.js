require('dotenv').config();
const mongoose = require('mongoose');

const {
  userStoriesHandler,
  userFollowingHandler,
  userResponsesHandler,
  userClappedHandler,
} = require('../user-route-handlers');
const models = require('../../../models');
const {
  setup,
  teardown,
  mocks: {
    storyMock,
    clapMock,
  },
} = require('../../../test-utils');

// const authorStories = (user, storiesCount) => Promise.all(
//   Array(storiesCount)
//   .fill(null)
//   .map(storyData => storyMock({ author: user, ...storyData })),
// );
// const authorResponses = (user, stories) => Promise.all(
//   Array(storiesCount)
//   .fill(null)
//   .map(() => storyMock({ author: user })),
// );
// const authorStories = (user, storiesData) => Promise.all(
//   storiesData.map(storyData => storyMock({ author: user, ...storyData })),
// );

// const populateUser = async (
//   user,
//   {
//     storiesCount = 0,
//     responsesCount = 0,
//     clapsData = 0,
//     followingUserIDs = 0,
//     userIDsToFollow = 0,
//   },
// ) => ({
//   stories: await authorStories(user, storiesCount),
//   responses: await authorResponses(user, responsesCount),
//   claps: await createClaps(user, clapsData),
//   followed: await followUser(user, followingUserIDs),
//   following: await followOthers(user, userIDsToFollow),
// });

describe('[/user/@username/] Route Handlers', () => {
  let pathUser;
  let clapped;
  let stories;
  let following;
  let responses;
  beforeAll(async () => {
    mongoose.connect(process.env.TEST_DB_URI, { useNewUrlParser: true });

    const data = await setup(models, { userCount: 4 }).catch(console.error);
    [pathUser, ...following] = data.users;
    stories = await Promise.all(
      Array(4)
      .fill(null)
      .map(() => models.Story.create(storyMock({ author: pathUser }))),
    );

    responses = await Promise.all(
      stories
      .slice(0, 2)
      .map(story => models.Story.create(storyMock({ author: pathUser, parent: story }))),
    );

    pathUser.following = following;
    await pathUser.save();

    clapped = await Promise.all(
      stories
      .slice(0, 2)
      .map(story => pathUser.clapForStory(story.id, 10)),
    );
  });

  afterAll(async () => {
    const collections = ['users', 'stories', 'claps'];
    await teardown(mongoose, collections);
  });

  describe('[/stories] handler', () => {
    let response;
    beforeAll(async () => {
      const mockRes = { json: (data) => data };
      response = await userStoriesHandler({ pathUser }, mockRes);
    });

    test('returns the user\'s [Story] Array', () => {
      expect(response).toBeDefined();
      console.log(response[0].author);
      // expect(response.length).toBe(stories.length);
      // expect(response.every(story => story.author === pathUser._id));
    });
  });
});
