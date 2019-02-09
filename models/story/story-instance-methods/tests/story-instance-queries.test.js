const { getClapsCount, getClappedReaders, getReplies } = require('../story-instance-queries');

const populaterMock = {
  populate() { return this; },
  execPopulate() { return new Promise(res => res(this)); },
}

describe('Story instance query methods', () => {
  test('getClapsCount(): returns the aggregate count of all claps from readers', async () => {
    const numClaps = 5;
    const countPerClap = 20;
    const claps = Array(numClaps).fill().map(() => ({ count: countPerClap }));
    // mock a Story that can populate its claps property
    const storyMock = Object.assign({ claps, getClapsCount }, populaterMock);

    const output = await storyMock.getClapsCount();
    expect(output).toBe(numClaps * countPerClap);
  });

  test('getClappedReaders(): returns an Array [User] of all the clapped readers', async () => {
    const numClaps = 5;
    // mock a Clap that can populate its user property
    const clapMock = (id) => Object.assign({ user: { id } }, populaterMock);
    // assign the mapping index to the clap.user.id property for simple testing
    const claps = Array(numClaps).fill().map((_, id) => clapMock(id));
    // mock a Story that can populate its claps property
    const storyMock = Object.assign({ claps, getClappedReaders }, populaterMock);

    const output = await storyMock.getClappedReaders();
    expect(output.length).toBe(numClaps);
    expect(output[0].id).toBe(0); // IDs are set by index when mapping the clap mocks
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
      populate: jest.fn(() => storyMock),
      execPopulate: jest.fn(() => storyMock),
      model: jest.fn(() => StoryMock), // simulate Story model access
    };

    beforeAll(() => storyMock.getReplies({ limit, currentPage }));

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
