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
describe('User Model', () => {
  let userOne;
  let userTwo;
  let story;
  let clap;
  let response;
  beforeAll(async () => {
    const { MONGO_URI, MONGO_DB } = process.env;
    mongoose.connect(`${MONGO_URI}${MONGO_DB}`, { useNewUrlParser: true });

    const data = await setup({ userCount: 2 });
    [userOne, userTwo] = data.users;
  });

  afterAll(async () => {
    const collections = ['users', 'stories', 'claps'];
    return teardown(mongoose, collections);
  });

  describe('virtuals', () => {
    describe('stories', () => {
      let stories;
      beforeAll(async () => {
        story = await models.Story.create(storyMock({ author: userOne }));
        userOne = await userOne.populate('stories').execPopulate();
        stories = userOne.stories;
      });

      test('returns all stories user is an author of', () => {
        expect(stories).toBeDefined();
        expect(stories.length).toBe(1);
        expect(stories[0].id).toEqual(story.id);
      });
    });

    describe('claps', () => {
      let claps;
      beforeAll(async () => {
        clap = await models.Clap.create(clapMock({ user: userOne, story }));
        userOne = await userOne.populate('claps').execPopulate();
        claps = userOne.claps;
      });

      test('returns all the claps the user has made', () => {
        expect(claps).toBeDefined();
        expect(claps.length).toBe(1);
        expect(claps[0].id).toEqual(clap.id);
      });
    });

    describe('followingList and followersList', () => {
      let followingList;
      let followersList;
      beforeAll(async () => {
        // userOne is followed by userTwo
        await models.Follow.create({ followedUser: userOne, follower: userTwo });
        
        userOne = await userOne.populate('followersList').execPopulate();
        followersList = userOne.followersList;
  
        userTwo = await userTwo.populate('followingList').execPopulate();
        followingList = userTwo.followingList;
      });

      test('user.followingList returns a [Follow] list where the follower id is of the user', () => {
        expect(followingList.length).toBe(1);
        expect(followingList[0].follower).toEqual(userTwo._id);
      });

      test('user.followersList returns a [Follow] list where the followedUser id is of the user', () => {
        expect(followersList.length).toBe(1);
        // when comparing String types on both sides use the 'id' field
        // when comparing ObjectID types use the '_id' field
        expect(followersList[0].followedUser).toEqual(userOne._id);
      });
    });
  });

  describe('instance methods', () => {
    describe('getStories()', () => {
      let result;
      beforeAll(async () => { result = await userOne.getStories({}); });

      test('returns the users stories', () => {
        expect(result).toBeDefined();
        expect(result.length).toBe(1);
        expect(result[0].id).toEqual(story.id);
      })
    });

    describe('getResponses()', () => {
      let result;
      beforeAll(async () => {
        response = await models.Story.create(storyMock({ author: userOne, parent: story }));
        result = await userOne.getResponses({});
      });

      test('returns the users responses', () => {
        expect(result).toBeDefined();
        expect(result.length).toBe(1);
        expect(result[0].id).toEqual(response.id);
      })
    });

    describe('getClaps()', () => {
      let result;
      beforeAll(async () => { result = await userOne.getClaps({}); });

      test('returns the users claps', () => {
        expect(result).toBeDefined();
        expect(result.length).toBe(1);
        expect(result[0].id).toEqual(clap.id);
      })
    });

    describe('getFollowers()', () => {
      let result;
      // userOne is the user being followed
      beforeAll(async () => { result = await userOne.getFollowers({}); });

      test('returns a [User] list of the user\'s followers', () => {
        expect(result).toBeDefined();
        expect(result.length).toBe(1);
        expect(result[0].id).toEqual(userTwo.id);
      });
    });

    describe('getFollowing()', () => {
      let result;
      // userTwo is the follower
      beforeAll(async () => { result = await userTwo.getFollowing({}); });

      test('returns a [User] list that the user follows', () => {
        expect(result).toBeDefined();
        expect(result.length).toBe(1);
        expect(result[0].id).toEqual(userOne.id);
      });
    });

    describe('followUser()', () => {
      beforeAll(async () => {
        await userOne.followUser
      });
    });
  });

  describe('pre-remove hook: cascade delete through associated collections', () => {
    let userFollows;    
    let userStories;
    let userClaps;
    beforeAll(async () => {
      const userOneID = userOne.id;
      await userOne.remove();

      userFollows = await models.Follow.find({
        $or: [{ followedUser: userOneID }, { follower: userOneID }]
      });
      userStories = await models.Story.find({ author: userOneID });
      userClaps = await models.Clap.find({ user: userOneID });
    });

    test('cascades to destroy authored stories', () => expect(userStories.length).toBe(0));
    test('cascades to destroy claps made by the user', () => expect(userClaps.length).toBe(0));
    test('cascades to destroy related follow objects (following and followed)', () => expect(userFollows.length).toBe(0));
  });
});
