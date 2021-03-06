const { injectStoryClap } = require('../story-claps-middleware');

const resMock = {
  status: jest.fn(() => resMock),
  json: jest.fn(),
};

const nextMock = jest.fn();

describe('Story-Clap middleware', () => {
  describe('injectStoryClap', () => {
    const pathClap = { id: 'clapID' };
    const pathUser = { id: 'userID' };
    const pathStory = { id: 'storyID' };
    const models = { Clap: { findOne: jest.fn() } };
    const reqMock = { context: { models, pathUser, pathStory, } };

    test('clap not found: returns a 404 JSON response { error: "clap not found" }', async () => {
      models.Clap.findOne.mockImplementation(() => null);

      await injectStoryClap(reqMock, resMock);
      expect(resMock.status).toHaveBeenCalledWith(404);
      expect(resMock.json).toHaveBeenCalledWith({ error: 'clap not found' });

      jest.clearAllMocks();
    });

    describe('clap found', () => {
      beforeAll(async () => {
        models.Clap.findOne.mockImplementation(() => pathClap);
        await injectStoryClap(reqMock, resMock, nextMock);
      });
      afterAll(() => jest.clearAllMocks());

      test('clap found: looks up the corresponding clap using the pathStory and pathUser', () => {
        expect(models.Clap.findOne).toHaveBeenCalledWith({ reader: pathUser, story: pathStory });
      });
  
      test('clap found: injects req.context.pathClap and calls next()', () => {
        expect(reqMock.context.pathClap).toEqual(pathClap);
        expect(nextMock).toHaveBeenCalled();
      });
    });
  });
});
