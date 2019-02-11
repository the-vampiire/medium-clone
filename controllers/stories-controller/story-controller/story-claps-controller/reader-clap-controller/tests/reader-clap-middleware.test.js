const { requireClapOwnership } = require('../reader-clap-middleware');

const resMock = {
  status: jest.fn(() => resMock),
  json: jest.fn(),
};

const nextMock = jest.fn();

describe('Reader-Clap middleware', () => {
  describe('requireClapOwnership(): verifies authedUser owns the clap resource', () => {
    afterEach(() => jest.clearAllMocks());

    test('pathClap reader is authedUser: calls next()', async () => {
      const reqMock = {
        authedUser: { id: 'sameID' },
        pathClap: { reader: 'sameID' },
      };

      await requireClapOwnership(reqMock, resMock, nextMock);
      expect(nextMock).toHaveBeenCalled();
    });
    
    test('pathClap reader not authedUser: 401 JSON response { error: "clap ownership required" }', async () => {
      const reqMock = {
        authedUser: { id: 'userID' },
        pathClap: { reader: 'readerID' },
      };
  
      await requireClapOwnership(reqMock, resMock);
      expect(resMock.status).toHaveBeenCalledWith(401);
      expect(resMock.json).toHaveBeenCalledWith({ error :'clap ownership required' });
    });
  });
});
