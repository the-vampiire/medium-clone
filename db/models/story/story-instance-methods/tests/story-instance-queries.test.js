const { getClapsCount, getClappedReaders, getReplies } = require('../story-instance-queries');

describe('Story instance query methods', () => {
  test('getClapsCount(): returns the aggregate count of all claps from readers', async () => {
    const numClaps = 5;
    const countPerClap = 20;
    const claps = Array(numClaps).fill().map(() => ({ count: countPerClap }));
    // mock a Story that can populate its claps property
    const storyMock = {
      claps,
      getClapsCount,
      populate: jest.fn(() => storyMock),
      execPopulate: jest.fn(() => storyMock),
    };
    storyMock.execPopulate.mockImplementation(() => new Promise(res => res(storyMock)));

    const output = await storyMock.getClapsCount();
    expect(output).toBe(numClaps * countPerClap);

    jest.clearAllMocks();
  });
  
  describe('getClappedReaders(): gets a paginated list of clapped readers', () => {
    const limit = 17;
    const currentPage = 2;
    const query = { limit, currentPage };

    const readerMock = { toResponseShape: jest.fn(() => readerMock) };
    const clapMock = {
      reader: readerMock,
      populate: jest.fn(() => clapMock),
      execPopulate: jest.fn(() => clapMock),
    };

    const StoryMock = { addPagination: jest.fn() };
    const storyMock = {
      claps: [clapMock],
      getClappedReaders,
      model: jest.fn(() => StoryMock),
      populate: jest.fn(() => storyMock),
      execPopulate: jest.fn(() => storyMock),
    };

    beforeAll(() => storyMock.getClappedReaders(query));
    afterAll(() => jest.clearAllMocks());

    test('populates the story claps: uses pagination, sort by count descending', () => {
      const expectedPopulateOptions = {
        path: 'claps',
        options: { limit, skip: currentPage * limit, sort: { count: -1 } },
      };

      expect(storyMock.populate).toHaveBeenCalledWith(expectedPopulateOptions);
    });

    test('populates and calls toResponseShape() the reader of each clap', () => {
      expect(clapMock.populate).toHaveBeenCalledWith('reader');
      expect(readerMock.toResponseShape).toHaveBeenCalled();
    });

    test('calls the Story static addPagination() method: { output: { readers }, limit, currentPage }', () => {
      const output = { readers: [readerMock] };
      expect(StoryMock.addPagination).toHaveBeenCalledWith({ output, limit, currentPage });
    });
  });

  describe('getReplies(): gets a paginated list of the story replies', () => {
    const replyMock = { toResponseShape: jest.fn(() => replyMock) };
    const replies = Array(5).fill().map(() => replyMock);
    const limit = 3;
    const currentPage = 5;
    const expectedPopulateOptions = {
      path: 'replies',
      options: {
        limit,
        skip: currentPage * limit,
        sort: { publishedAt: -1 },
        match: { published: true },
      },
    };

    const StoryMock = { addPagination: jest.fn() };

    const storyMock = {
      replies,
      getReplies,
      model: jest.fn(() => StoryMock),
      populate: jest.fn(() => storyMock),
      execPopulate: jest.fn(() => storyMock),
    }

    beforeAll(() => storyMock.getReplies({ limit, currentPage }));
    afterAll(() => jest.clearAllMocks());

    test('populates the replies: uses pagination, publishedAt desc sorting, and only published', () => {
      expect(storyMock.populate).toHaveBeenCalledWith(expectedPopulateOptions);
      expect(storyMock.execPopulate).toHaveBeenCalled();
    });

    test('calls toResponseShape() on each reply found', () => {
      expect(replies[0].toResponseShape).toHaveBeenCalled();
    });

    test('call static addPagination() method: { output: { replies }, limit, currentPage }', () => {
      expect(StoryMock.addPagination).toHaveBeenCalledWith({ output: { replies }, limit, currentPage });
    });
  });
});
