const { createNewStory } = require('../stories-route-handlers');

const resMock = {
  status() { return this; },
  json: content => content,
};

const statusSpy = jest.spyOn(resMock, 'status');
const jsonSpy = jest.spyOn(resMock, 'json');

const title ='a title';
const body ='a body';
const storyMock = { title, body, toResponseShape: () => ({ title, body }) };

const authedUserMock = { id: 'anID', username: 'the-vampiire' };

describe('/stories Route Handlers', () => {
  afterEach(() => {
    jsonSpy.mockClear();
    statusSpy.mockClear();
  });

  describe('createNewStory(): handler for new stories', () => {
    test('valid Story payload: creates a story and returns a Story Response Shape', async () => {
      const models = { Story: { create: () => storyMock } };
      const reqMock = { body: { title, body }, authedUser: authedUserMock, models };

      await createNewStory(reqMock, resMock);
      expect(jsonSpy).toHaveBeenCalledWith(storyMock.toResponseShape());
    });

    test('missing title: returns 400 JSON response { error }', async () => {
      const reqMock = { body: { body } };
      
      await createNewStory(reqMock, resMock);
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({ error: 'title missing' });
    });
  });
});