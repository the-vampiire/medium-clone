const { buildEndpoint } = require('../../../../pagination-utils');
const {
  followUserHandler,
  unfollowUserHandler,
  userFollowersHandler,
} = require('../user-followers-route-handlers');

const resMock = {
  set: jest.fn(),
  json: jest.fn(),
  sendStatus: jest.fn(),
  status: jest.fn(() => resMock),
}

jest.mock('../../../../pagination-utils', () => ({ buildEndpoint: jest.fn() }));

describe('User Followers route handlers', () => {
  describe('userFollowersHandler(): fetches a paginated list of members following the path user', () => {
    const pathUser = { getFollowers: jest.fn() };
    const reqMock = { context: { pathUser }, query: {} };

    beforeAll(() => userFollowersHandler(reqMock, resMock));
    afterAll(() => jest.clearAllMocks());

    test('retrieves the paginated list of followers: calls getFollowers(query)', () => {
      expect(pathUser.getFollowers).toHaveBeenCalledWith(reqMock.query);
    });

    test('returns a JSON response with the paginated followers list', () => {
      expect(resMock.json).toHaveBeenCalledWith(pathUser.getFollowers());
    });
  });

  describe('followUserHandler(): supports the authed user following the path user', () => {
    const pathUser = { slug: '@the-vampiire' };
    const authedUser = { followUser: jest.fn(), slug: '@the-werewolf' };
    const reqMock = { context: { authedUser, pathUser } };

    afterAll(() => jest.clearAllMocks());

    describe('successful follow', () => {
      beforeAll(() => followUserHandler(reqMock, resMock));
      afterAll(() => jest.clearAllMocks());

      test('calls followUser() on the authedUser passing the pathUser to be followed', () => {
        expect(authedUser.followUser).toHaveBeenCalledWith(pathUser);
      });

      test('calls buildEndpoint() util to build the new follower URL', () => {
        expect(buildEndpoint).toHaveBeenCalledWith({
          basePath: `users/${pathUser.slug}`,
          path: `followers/${authedUser.slug}`,
        });
      });

      test('sets the Location header with the new follower URL', () => {
        expect(resMock.set).toHaveBeenCalledWith({ Location: buildEndpoint() });
      });

      test('returns sendStatus() with a 201 created status code', () => {
        expect(resMock.sendStatus).toHaveBeenCalledWith(201);
      });
    });

    test('error encountered during follow: JSON response with the error.status and error.message in { error }', async () => {
      const error = { status: 404, message: 'bad things' };
      authedUser.followUser.mockImplementation(() => { throw error });

      await followUserHandler(reqMock, resMock);
      expect(resMock.status).toHaveBeenCalledWith(error.status);
      expect(resMock.json).toHaveBeenCalledWith({ error: error.message });
    });
  });
});
