const { Story } = require('../../../../models');
const {
  storyDiscoveryHandler,
  storyUpdateHandler,
  storyDeleteHandler,
} = require('../story-route-handlers');

const resMock = {
  status: jest.fn(() => resMock),
  json: jest.fn(),
  sendStatus: jest.fn(),
};

const storyMock = {
  toResponseShape: jest.fn(), // already tested, can mock
  save: jest.fn(),
};

describe('Story Controller route handlers', () => {
  test('storyDiscoveryHandler(): returns JSON response of pathStory in Story Response Shape', async () => {
    const reqMock = { pathStory: storyMock };

    await storyDiscoveryHandler(reqMock, resMock);
    expect(storyMock.toResponseShape).toHaveBeenCalled();
    expect(resMock.json).toHaveBeenCalledWith(storyMock.toResponseShape());

    jest.clearAllMocks();
  });

  describe('storyUpdateHandler(): manages updates to an existing story', () => {
    const bodyMock = { title: 'a new title', body: 'a new body' };
    // initial data for comparison since pathStory is mutated during flow
    const initialData = { title: 'original title', body: 'original body', published: false };
    
    const pathStoryMock = () => {
      const mock = {
        ...initialData,
        save: jest.fn(() => mock),
        toResponseShape: jest.fn(() => mock),
      };
      
      return mock;
    };

    afterEach(() => jest.clearAllMocks());

    test('title only: only updates the story title', async () => {
      const pathStory = pathStoryMock();
      resMock.json.mockImplementation(() => pathStory);
      const reqMock = { pathStory, body: { title: bodyMock.title } };
  
      const output = await storyUpdateHandler(reqMock, resMock);
      expect(output.title).toBe(bodyMock.title);
      expect(output.body).toBe(initialData.body);
      expect(output.published).toBe(initialData.published);
    });

    test('body only: only updates the story body', async () => {
      const pathStory = pathStoryMock();
      resMock.json.mockImplementation(() => pathStory);
      const reqMock = { pathStory, body: { body: bodyMock.body } };
  
      const output = await storyUpdateHandler(reqMock, resMock);
      expect(output.body).toBe(bodyMock.body);
      expect(output.title).toBe(initialData.title);
      expect(output.published).toBe(initialData.published);
    });

    describe('published field only', () => {
      test('published true: sets published true and publishedAt = new Date()', async () => {
        const pathStory = pathStoryMock();
        resMock.json.mockImplementation(() => pathStory);
        const reqMock = { pathStory, body: { published: true } };
    
        const output = await storyUpdateHandler(reqMock, resMock);
        expect(output.published).toBe(true);
        expect(output.publishedAt.constructor.name).toBe('Date')
      });

      test('published false: sets published false and publishedAt = null', async () => {
        const pathStory = pathStoryMock();
        resMock.json.mockImplementation(() => pathStory);
        const reqMock = { pathStory, body: { published: false } };
    
        const output = await storyUpdateHandler(reqMock, resMock);
        expect(output.published).toBe(false);
        expect(output.publishedAt).toBeNull();
      });
    });

    test('multiple fields: updates with all provided fields', async () => {
      const pathStory = pathStoryMock();
      resMock.json.mockImplementation(() => pathStory);
      const reqMock = { pathStory, body: { ...bodyMock, published: true } };
  
      const output = await storyUpdateHandler(reqMock, resMock);
      expect(output.title).toBe(bodyMock.title);
      expect(output.body).toBe(bodyMock.body);
      expect(output.published).toBe(true);
      expect(output.publishedAt).toBeDefined();
    });

    test('any case: saves the updated story and returns it in a JSON response Story Response Shape', async () => {
      const pathStory = pathStoryMock();
      const reqMock = { pathStory, body: {} };
  
      await storyUpdateHandler(reqMock, resMock);
      expect(pathStory.save).toHaveBeenCalled();
      expect(pathStory.toResponseShape).toHaveBeenCalled();
      expect(resMock.json).toHaveBeenCalledWith(pathStory.toResponseShape());
    });
  });

  describe('storyDeleteHandler(): deletes a Story', () => {
    const toDeleteMock = { remove: jest.fn() };
    const reqMock = { pathStory: toDeleteMock };

    beforeAll(() => storyDeleteHandler(reqMock, resMock));
    afterAll(() => jest.clearAllMocks());

    test('deletes the story', () => {
      expect(toDeleteMock.remove).toHaveBeenCalled();
    });

    test('responds with a 204 status code (success + no content)', () => {
      expect(resMock.sendStatus).toHaveBeenCalledWith(204);
    });
  });
});
 