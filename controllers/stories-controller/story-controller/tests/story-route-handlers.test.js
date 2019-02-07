const { Story } = require('../../../../models');
const {
  storyDiscoveryHandler,
  storyUpdateHandler,
  storyDeleteHandler,
} = require('../story-route-handlers');

const resMock = {
  status: jest.fn(() => resMock),
  json: jest.fn(),
};

const storyMock = {
  toResponseShape: jest.fn(), // already tested, can mock
};

describe('Story Controller route handlers', () => {
  afterEach(() => jest.clearAllMocks());

  test('storyDiscoveryHandler(): returns JSON response of pathStory in Story Response Shape', async () => {
    const reqMock = { pathStory: storyMock };

    await storyDiscoveryHandler(reqMock, resMock);
    expect(storyMock.toResponseShape).toHaveBeenCalled();
    expect(resMock.json).toHaveBeenCalledWith(storyMock.toResponseShape());
  });

  describe('storyUpdateHandler(): manages updates to an existing story', () => {
    const bodyMock = { title: 'a new title', body: 'a new body', published: false };
    const storyBase = new Story({ title: 'original title', body: 'original body', published: true });
    const pathStory = Object.assign(storyBase, { update: jest.fn() }, storyMock);
    const updatedMock = data => Object.assign(new Story({ ...data }), storyMock);

    test('given title: updates the title only', async () => {
      const reqMock = { pathStory, body: { title: bodyMock.title } };
      pathStory.update.mockImplementation(() => updatedMock(reqMock.body));

      await storyUpdateHandler(reqMock, resMock);
      expect(pathStory.update).toHaveBeenCalledWith({ title: bodyMock.title });
    });

    test('given body: updates the body only', async () => {
      const reqMock = { pathStory, body: { body: bodyMock.body } };
      pathStory.update.mockImplementation(() => updatedMock(reqMock.body));
      
      await storyUpdateHandler(reqMock, resMock);
      expect(pathStory.update).toHaveBeenCalledWith({ body: bodyMock.body });
    });

    test('given published: updates the published field only', async () => {
      const reqMock = { pathStory, body: { published: bodyMock.published } };
      pathStory.update.mockImplementation(() => updatedMock(reqMock.body));
      
      await storyUpdateHandler(reqMock, resMock);
      expect(pathStory.update).toHaveBeenCalledWith({ published: bodyMock.published });
    });

    test('given all three: updates all three fields', async () => {
      const reqMock = { pathStory, body: bodyMock };
      pathStory.update.mockImplementation(() => updatedMock(bodyMock));
      
      await storyUpdateHandler(reqMock, resMock);
      expect(pathStory.update).toHaveBeenCalledWith(bodyMock);
    });

    test('returns a JSON response with the updated story in Story Response Shape', async () => {
      const reqMock = { pathStory, body: bodyMock };
      const updated = updatedMock(bodyMock);
      pathStory.update.mockImplementation(() => updated);

      await storyUpdateHandler(reqMock, resMock);
      expect(updated.toResponseShape).toHaveBeenCalled();
      expect(resMock.json).toHaveBeenCalledWith(updated.toResponseShape());
    });
  });

  describe('storyDeleteHandler(): deletes a Story', () => {
    const authedUserMock = { verifyPassword: jest.fn() };
    const toDeleteMock = { destroy: jest.fn() };

    test('no password provided: returns 401 JSON response with { error: "failed to authenticate" }', async () => {
      const reqMock = { pathStory: toDeleteMock, authedUser: authedUserMock, body: {} };
      authedUserMock.verifyPassword.mockImplementation(() => false);

      await storyDeleteHandler(reqMock, resMock);
      expect(resMock.status).toHaveBeenCalledWith(401);
      expect(resMock.json).toHaveBeenCalledWith({ error: 'failed to authenticate' });
    });

    test('invalid password provided: returns 401 JSON response with { error: "failed to authenticate" }', async () => {
      const reqMock = { pathStory: toDeleteMock, authedUser: authedUserMock, body: {} };
      authedUserMock.verifyPassword.mockImplementation(() => false);

      await storyDeleteHandler(reqMock, resMock);
      expect(resMock.status).toHaveBeenCalledWith(401);
      expect(resMock.json).toHaveBeenCalledWith({ error: 'failed to authenticate' });
    });

    test('valid password provided: deletes the story and responds with a 201 status code', async () => {
      const reqMock = { pathStory: toDeleteMock, authedUser: authedUserMock, body: { password: 'a secret one' } };
      authedUserMock.verifyPassword.mockImplementation(() => true);

      await storyDeleteHandler(reqMock, resMock);
      expect(toDeleteMock.destroy).toHaveBeenCalled();
      expect(resMock.status).toHaveBeenCalledWith(204);
    });
  });
});
 