const { extractFieldErrors } = require('../../../../../controller-utils');
const {
  readerClapDiscoveryHandler,
  updateReaderClapHandler,
} = require('../reader-clap-route-handlers');

jest.mock('../../../../../controller-utils', () => ({ extractFieldErrors: jest.fn(() => ({})) }));

const resMock = {
  status: jest.fn(() => resMock),
  json: jest.fn(),
  sendStatus: jest.fn(),
};

describe('Reader-Clap route handlers', () => {
  test('readerClapDiscoveryHandler(): returns a JSON response with the Clap Response Shape', async () => {
    const pathClap = { toResponseShape: jest.fn() };
    const reqMock = { context: { pathClap } };
    
    await readerClapDiscoveryHandler(reqMock, resMock);
    expect(pathClap.toResponseShape).toHaveBeenCalled();
    expect(resMock.json).toHaveBeenCalledWith(pathClap.toResponseShape());
  });

  describe('updateReaderClapHandler(): updates a reader\'s story clap', () => {
    afterEach(() => jest.clearAllMocks());

    const pathClap = { remove: jest.fn(), save: jest.fn() };

    test('count valid: updates the clap count and returns a JSON Clap Response Shape', async () => {
      const count = 34;
      const updatedClap = { toResponseShape: jest.fn() };
      pathClap.save.mockImplementation(() => updatedClap);
      const reqMock = { context: { pathClap }, body: { count } };

      await updateReaderClapHandler(reqMock, resMock);
      expect(pathClap.save).toHaveBeenCalled();
      expect(updatedClap.toResponseShape).toHaveBeenCalled();
      expect(resMock.json).toHaveBeenCalledWith(updatedClap.toResponseShape());
    });

    test('count null: destroys the clap and returns a 204 response', async () => {
      const reqMock = { context: { pathClap }, body: { count: null } };
      
      await updateReaderClapHandler(reqMock, resMock);
      expect(pathClap.remove).toHaveBeenCalled();
      expect(resMock.sendStatus).toHaveBeenCalledWith(204);
    });

    test('count missing: returns 400 JSON response { error: "clap count required" }', async () => {
      const reqMock = { context: { pathClap }, body: {} };

      await updateReaderClapHandler(reqMock, resMock);
      expect(resMock.status).toHaveBeenCalledWith(400);
      expect(resMock.json).toHaveBeenCalledWith({ error: "clap count required" });
    });

    test('count invalid: returns a 400 JSON response { error: "clap update validation failed", fields }', async () => {
      const count = 400;
      pathClap.save.mockImplementation(() => {
        throw new Error(JSON.stringify({ errors: {} }));
      });
      const reqMock = { context: { pathClap }, body: { count } };
      
      await updateReaderClapHandler(reqMock, resMock);
      expect(pathClap.save).toHaveBeenCalled();
      expect(extractFieldErrors).toHaveBeenCalled();
      expect(resMock.status).toHaveBeenCalledWith(400);
      expect(resMock.json).toHaveBeenCalledWith({
        error: 'clap update validation failed',
        fields: {},
      });
    });
  });
});
