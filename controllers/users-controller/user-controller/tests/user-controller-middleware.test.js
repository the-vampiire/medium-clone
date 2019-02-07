const { exchangeSlugForUser } = require('../user-controller-middleware');

const resMock = {
  status: jest.fn(() => resMock),
  json: jest.fn(),
};

const UserMock = { findOne: jest.fn() };

const reqMockBase = { models: { User: UserMock } };

describe('User Controller middleware', () => {
  afterEach(() => jest.clearAllMocks());

  describe('exchangeSlugForUser', () => {
    test('usernameSlug does not begin with @: 400 JSON response { error: "invalid username" }', async () => {
      const reqMock = { ...reqMockBase, params: { usernameSlug: 'the-vampiire' } };

      await exchangeSlugForUser(reqMock, resMock);
      expect(resMock.status).toHaveBeenCalledWith(400);
      expect(resMock.json).toHaveBeenCalledWith({ error: 'invalid username' });
    });

    test('user is not found: 404 JSON response { error: "user not found" }', async () => {
      const reqMock = { ...reqMockBase, params: { usernameSlug: '@the-vampiire' } };
      UserMock.findOne.mockImplementation(() => null);

      await exchangeSlugForUser(reqMock, resMock);
      expect(resMock.status).toHaveBeenCalledWith(404);
      expect(resMock.json).toHaveBeenCalledWith({ error: 'user not found' });

    });

    test('user is found for @username slug: next() called and req.pathUser contains matching User', async () => {
      const mockUser = { username: 'the-vampiire' };
      const reqMock = { ...reqMockBase, params: { usernameSlug: '@the-vampiire' } };
      UserMock.findOne.mockImplementation(() => mockUser);

      const nextMock = jest.fn();

      await exchangeSlugForUser(reqMock, null, nextMock);
      expect(UserMock.findOne).toHaveBeenCalledWith({ username: mockUser.username });
      expect(nextMock).toHaveBeenCalled();
      expect(reqMock.pathUser).toBe(mockUser)
    });
  });
});
