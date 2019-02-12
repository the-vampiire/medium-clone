const { constants: { MAX_CLAP_COUNT } } = require('../../../index');
const { followUser, unfollowUser, respondToStory, clapForStory } = require('../user-instance-mutations');


describe('User instance mutation methods', () => {
  describe('followUser(): updates the followers and following lists of each user', () => {
    const userMock = {
      id: 'anID',
      followUser,
      following: [],
      followers: [],
      model: jest.fn(),
      update: jest.fn(),
    };

    test('user following self: throws { status: 403 , message: "can not follow self" }', async () => {
      const followingUser = Object.assign({}, userMock);
      const followedUser = Object.assign({}, userMock);

      try { await followingUser.followUser(followedUser); }
      catch (error) { expect(error).toEqual({ status: 403 , message: "can not follow self" }); }
    });

    test('user is already following: throws { status: 400, message: "already following" }', async () => {
      const followingUser = Object.assign({}, userMock);
      const followedUser = Object.assign({}, userMock, { id: 'differentID' });
      followingUser.following.push(followedUser);

      try { await followingUser.followUser(followedUser); }
      catch (error) { expect(error).toEqual({ status: 400, message: "already following" }); }
    });
    
    describe('valid follow', () => {
      const followingUser = Object.assign({}, userMock);
      const followedUser = Object.assign({}, userMock, { id: 'differentID' });

      beforeAll(() => followingUser.followUser(followedUser));

      test('calls update() on the followed user to push the new follower to its followers list', () => {
        expect(followedUser.update).toHaveBeenCalledWith({ $push: { followers: followingUser } });
      });

      test('calls update() on the following user to push the followed user to its following list', () => {
        expect(followingUser.update).toHaveBeenCalledWith({ $push: { following: followedUser } });
      });
    });
  });

  describe('unfollowUser(): updates the following and followers lists of each user', () => {
    const follower = { id: 'followerID', update: jest.fn() };
    const userMock = { following: ['followerID'], update: jest.fn(), unfollowUser };

    describe('successful unfollow', () => {
      beforeAll(() => userMock.unfollowUser(follower));

      test('calls update() on the follower to remove the user from its following list', () => {
        expect(follower.update).toHaveBeenCalledWith({ $pull: { following: { _id: userMock } } });
      });

      test('calls update() on the user to remove the follower from its followers list', () => {
        expect(userMock.update).toHaveBeenCalledWith({ $pull: { followers: { _id: follower } } });
      });
    });

    test('follower not in user\'s followers list: throws { status: 400, message: not following }', async () => {
      const user = Object.assign({}, userMock, { following: [] });

      try {
        await user.unfollowUser(follower);
      } catch(error) {
        expect(error).toEqual({ status: 400, message: 'not following' });
      }
    });
  });

  describe('respondToStory(): publishes a response to a story', () => {
    const publishedAt = new Date();
    const body = 'this is the first sentence. and a second sentence';
    const storyMock = { id: 'storyID' };
    const StoryMock = { findById: jest.fn(() => storyMock), create: jest.fn() };
    const userMock = { model: jest.fn(() => StoryMock), respondToStory };

    beforeAll(() => userMock.respondToStory(storyMock.id, body, publishedAt));

    test('retrieves the Story model: model("stories")', () => {
      expect(userMock.model).toHaveBeenCalledWith('stories');
    });

    test('confirms the story exists with an ID only query', () => {
      expect(StoryMock.findById).toHaveBeenCalledWith(storyMock.id, '_id');
    });

    test('story does not exist: throws { status: 404, message: "story not found" }', async () => {
      StoryMock.findById.mockImplementationOnce(() => null);
      
      try { await userMock.respondToStory(storyMock.id, body); }
      catch(error) { expect(error).toEqual({ status: 404, message: "story not found" }); }
    });

    test('creates a published response passing the first sentence of the body as the title: { title, body, author: this, parent: story, published: true, publishedAt }', () => {
      expect(StoryMock.create).toHaveBeenCalledWith({
        title: body.split('.')[0],
        body,
        author: userMock,
        parent: storyMock,
        published: true,
        publishedAt,
      });
    });
  });

  describe('clapForStory(): manages a reader\'s clap for a story', () => {
    const clapsCount = 40;
    const storyMock = { id: 'storyID', author: { equals: jest.fn() } };
    // first call uses Story.findById, second call uses Clap.findOneAndUpdate
    const ModelMock = { findById: jest.fn(() => storyMock), findOneAndUpdate: jest.fn() };
    const userMock = { model: jest.fn(() => ModelMock), clapForStory };

    describe('valid path', () => {
      beforeAll(() => userMock.clapForStory(storyMock.id, clapsCount));
      afterAll(() => jest.clearAllMocks());

      test('retrieves the Story model', () => {
        expect(userMock.model).toHaveBeenCalledWith('stories');
      });
  
      test('confirms the story exists with an ID and author only query', () => {
        expect(ModelMock.findById).toHaveBeenCalledWith(storyMock.id, '_id author');
      });

      test('upserts a Clap for the reader and story setting the clap count', () => {
        expect(userMock.model).toHaveBeenCalledWith('claps');
        expect(ModelMock.findOneAndUpdate).toHaveBeenCalledWith(
          { reader: userMock, story: storyMock },
          { $set: { count: clapsCount } },
          { upsert: true, new: true },
        );
      });
    });

    describe('invalid paths', () => {
      test('clapsCount negative: sets count to minimum value of 1', async () => {
        await userMock.clapForStory(storyMock.id, -50);
        expect(ModelMock.findOneAndUpdate).toHaveBeenCalledWith(
          { reader: userMock, story: storyMock },
          { $set: { count: 1 } },
          { upsert: true, new: true },
        );
      });

      test(`clapsCount exceeds MAX_CLAP_COUNT: sets count to maximum value ${MAX_CLAP_COUNT}`, async () => {
        await userMock.clapForStory(storyMock.id, 500);
        expect(ModelMock.findOneAndUpdate).toHaveBeenCalledWith(
          { reader: userMock, story: storyMock },
          { $set: { count: MAX_CLAP_COUNT } },
          { upsert: true, new: true },
        );
      });

      test('story not found: throws { status: 404, message: "story not found" }', async () => {
        ModelMock.findById.mockImplementationOnce(() => null);
        
        try { await userMock.clapForStory(storyMock.id, clapsCount); }
        catch (error) { expect(error).toEqual({ status: 404, message: "story not found" }); }
      });

      test('author clapping for own story: throws { status: 403, message: "author clapping for own story" }', async () => {
        storyMock.author.equals.mockImplementationOnce(() => true);
        
        try { await userMock.clapForStory(storyMock.id, clapsCount); }
        catch (error) { expect(error).toEqual({ status: 403, message: "author clapping for own story" }); }
      });
    });
  });
});
