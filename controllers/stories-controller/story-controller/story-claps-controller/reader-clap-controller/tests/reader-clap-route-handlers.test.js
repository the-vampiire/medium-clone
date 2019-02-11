const { extractFieldErrors } = require('../../../../../controller-utils');
const {
  readerClapDiscoveryHandler,
  updateReaderClapHandler,
} = require('../reader-clap-route-handlers');

jest.mock('../../../../../controller-utils', () => ({ extractFieldErrors: jest.fn(() => ({})) }));

const resMock = {
  status: jest.fn(() => resMock),
  json: jest.fn(),
};

describe('Reader-Clap route handlers', () => {
  test('readerClapDiscoveryHandler(): returns a JSON response with the Clap Response Shape', async () => {
    const pathClap = { toResponseShape: jest.fn() };
    const reqMock = { pathClap };
    
    await readerClapDiscoveryHandler(reqMock, resMock);
    expect(pathClap.toResponseShape).toHaveBeenCalled();
    expect(resMock.json).toHaveBeenCalledWith(pathClap.toResponseShape());
  });

  describe('updateReaderClapHandler(): updates a reader\'s story clap', () => {
    afterEach(() => jest.clearAllMocks());

    const pathClap = { destroy: jest.fn(), update: jest.fn() };

    test('count valid: updates the clap count and returns a JSON Clap Response Shape', async () => {
      const count = 34;
      const updatedClap = { toResponseShape: jest.fn() };
      pathClap.update.mockImplementation(() => updatedClap);
      const reqMock = { pathClap, body: { count } };

      await updateReaderClapHandler(reqMock, resMock);
      expect(pathClap.update).toHaveBeenCalledWith({ count });
      expect(updatedClap.toResponseShape).toHaveBeenCalled();
      expect(resMock.json).toHaveBeenCalledWith(updatedClap.toResponseShape());
    });

    test('count null: destroys the clap and returns a 204 response', async () => {
      const reqMock = { pathClap, body: { count: null } };
      
      await updateReaderClapHandler(reqMock, resMock);
      expect(pathClap.destroy).toHaveBeenCalled();
      expect(resMock.status).toHaveBeenCalledWith(204);
    });

    test('count missing: returns 400 JSON response { error: "clap count required" }', async () => {
      const reqMock = { pathClap, body: {} };

      await updateReaderClapHandler(reqMock, resMock);
      expect(resMock.status).toHaveBeenCalledWith(400);
      expect(resMock.json).toHaveBeenCalledWith({ error: "clap count required" });
    });

    test('count invalid: returns a 400 JSON response { error: "clap update validation failed", fields }', async () => {
      const count = 400;
      pathClap.update.mockImplementation(() => {
        throw new Error(JSON.stringify({ errors: {} }));
      });
      const reqMock = { pathClap, body: { count } };
      
      await updateReaderClapHandler(reqMock, resMock);
      expect(pathClap.update).toHaveBeenCalledWith({ count });
      expect(extractFieldErrors).toHaveBeenCalled();
      expect(resMock.status).toHaveBeenCalledWith(400);
      expect(resMock.json).toHaveBeenCalledWith({
        error: 'clap update validation failed',
        fields: {},
      });
    });
  });
});
